# Canvas — Technical Architecture

This document describes the architecture of **Canvas**, a Miro-like whiteboard
shipped as a Vite-powered Module Federation remote that runs inside a Next.js
host.

## 1. Topology

```
┌───────────────────────────────  Next.js HOST  ───────────────────────────────┐
│                                                                              │
│  <Board />  ─────────────────────────────────────────────────────────────┐    │
│                          runtime import →  remoteEntry.js                │    │
└──────────────────────────────────────────────────────────────────────────┼───┘
                                                                           │
┌────────────────────────────  THIS REPO (REMOTE)  ────────────────────────▼───┐
│                                                                            │
│  Vite + @module-federation/vite                                             │
│  name: 'demos'  ·  exposes: { './DemosApp': './src/App.tsx' }               │
│                                                                            │
│  ┌───────────────┐   ┌────────────────────────────────────────────┐        │
│  │  App.tsx      │   │  React tree                                │        │
│  │  layout shell ├──►│  Toolbar ──render──► Konva Stage            │        │
│  └───────────────┘   │  (Zustand store shared between both)       │        │
│                      └────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────────────────────┘
```

- The remote exposes a **single React component** (`DemosApp`). The host does
  not need to know anything about Konva, Zustand, or the board internals.
- The remote is **self-contained**: `react` / `react-dom` are bundled directly
  instead of being federated/shared singletons. Keeping them out of `shared`
  avoids the known `@module-federation/vite` dev-mode race that crashes
  `react-dom/client` on Vite 8 + Rolldown (see § 7).

## 2. Process view (rendering pipeline)

The board is a set of stacked Konva layers inside one `<Stage>`. The whole
stage carries the **camera transform** (`x`, `y`, `scale`) from the store, so
all world/content coordinates are plain — zoom and pan never touch element
data.

```
Stage (fills .canvas-stage-host, x/y/scale = camera)
├── Layer "grid"        → GridBackground  (screen-fixed infinite grid; coordinates
│                          are derived from the camera so the dark fill + lines
│                          always cover the viewport, listening = false)
├── Layer "elements"    → one Group per element (draggable/clickable)
│                          ├── <Rect/>  for squares (transparent fill)
│                          ├── <Line/>  for freehand drawings
│                          ├── <Text/>  (+ selection rect) for text
│                          ├── <Rect+Text/> (+ selection rect) for stickers
│                          └── SelectionTransformer (squares only)
├── HTML overlay        → TextEditor <textarea> (fixed-position, above the stage)
│                          → ColorPanel (top-left, on selection)
│                          → BottomPanel (zoom controls + PNG/JSON export)
```

Design rules:

- **Grid layer is inert** (`listening={false}`) and **camera-aware**: the rect
  and lines are computed from `camera` such that their screen position never
  changes when zooming/pannning, so the board looks infinitely large. Grid
  spacing doubles when zoomed out far enough to keep the density readable.
- **Elements are interactive only in Select mode** (`listening = activeTool === 'select'`).
  While a creation tool (Square / Draw / Text / Sticker) is active, clicks pass
  through to the stage and create new elements instead of selecting existing ones.
- **Each element Group carries `id = element.id`** so Konva can locate it via
  `layer.findOne("#<id>")` for the Transformer and the text editor geometry.

## 3. State management (Zustand)

One global store, `src/store/canvasStore.ts`. Vanilla Zustand (`create`), no
middleware — all state is plain, serializable JSON (ready for persistence).

```
CanvasState {
  elements:      CanvasElement[]          // board content
  selectedId:    string | null
  editingId:     string | null            // text box / sticker currently edited
  activeTool:    "select" | "square" | "text" | "draw" | "sticker"
  camera:        { x, y, scale }         // viewport transform
  activeStickerFill: string              // fill for the next placed sticker

  addElement(el)          // push + select it
  updateElement(id, patch)
  removeElement(id)       // clears selection/editing if targeted
  select(id | null)
  setEditing(id | null)
  setActiveTool(tool)
  setCamera(patch)        // x/y/scale
  setActiveStickerFill(fill)
}
```

Selection and tool state sit next to element data because the pointer system
(see §4 and §10) needs them **synchronously at event time** — components read
the store via hooks for rendering, and the stage reads
`useCanvasStore.getState()` imperatively inside handlers.

## 4. Interaction flow

All pointer logic runs through a small **draft state machine** (`ToolDraft`)
which the stage keeps in local state (`useCanvasInteractions`) and the pure
handlers in `lib/interactions/canvas.ts` mutate:

```
ToolDraft = { kind: "square"; start; current }          ← drag-a-square
          | { kind: "draw";   points: ElementPosition[] } ← freehand line

beginDraft(tool, position) → tool is square/draw → creates the draft
extendDraft(draft, position) → pointer move → updates current / appends a point
handleStagePointerUp → finalizes the draft into a real element
```

### 4.1 Creation tools (Square / Draw / Text / Sticker)

```
down on stage ──► screen position via stage.getPointerPosition()
   │                (this is CSS screen px — Konva ignores the stage x/y/scale)
   │                world position = screenToWorld(screen, camera)  ← all
   │                element maths use world coords (elements are stored in world space
   │                and rendered through the camera transform)
   │
   ├─ "square" ──► draft {square, start( world), current}
   │                move → dashed preview Rect rendered from draft
   │                up   → if click (Δ < MIN) → drop default 160×120 square centered
   │                       else              → square from drawn bounds (transparent fill)
   │
   ├─ "draw" ────► draft {draw, points:[...]}
   │                move → preview <Line> from draft points
   │                up   → bounds baked: element.x/y = top-left, points are relative;
   │                       dropped only when 2+ points were captured
   │
   ├─ "text" ────► addElement(createText(world)) + setEditing(id)
   │                → editor opens immediately: empty box + "Type here…" placeholder,
   │                  click and type. A box committed blank is removed again.
   │
   └─ "sticker" ─► addElement(createSticker(world, activeStickerFill)) + setEditing(id)
                    → editor opens immediately (default note selected, first keystroke
                      replaces it). Double-click any existing sticker to re-edit.
```

Any created element is selected automatically, which makes the floating
ColorPanel appear at the top-left (see §4.4).

### 4.2 Zoom & pan (camera)

- **Wheel** → `handleStageWheel` zooms around the pointer: world point under
  the cursor stays fixed, `scale` is clamped to `[0.15, 5]` (`lib/interactions/zoom.ts`).
- **Pan** → drag empty canvas space (in Select mode), hold **Space** + drag, or
  drag with the **middle button**. Panning mutates `camera.x/y` only.
- The bottom panel `−`/`+`/`Reset` zoom around the **center** of the stage
  using the same `zoomAt` math.
- Because the grid is camera-aware and the stage transform is applied at render
  time, **zooming out simply reveals more of the infinite board** — nothing is
  clipped or letterboxed.

### 4.3 Selection + manipulation (Select tool)

- Click element → `select(id)`, `cancelBubble` prevents stage deselect.
- Click empty space → a pan "candidate" starts; if released without moving it
  deselects, if dragged past a threshold it becomes a pan.
- Drag element → Konva DnD → `updateElement(id, { x, y })` on dragend.
- Resize square → Konva `Transformer` attached to the element Group.
  On `transformEnd` the Group scale is read (`node.getClientRect()`), reset to
  1, and the baked `width`/`height` written back to the store. Never relies on
  the Transformer's internal scale persisting.
- `Del` / `Backspace` → `removeElement`. `Esc` → deselect (and close editor).
- **No tool-switching hotkeys.** Tools are only switched via the toolbar, so a
  stray keystroke can never change the active tool mid-workflow. The keyboard
  exclusively owns canvas-level actions (Space-pan, Esc, Del).

### 4.4 Color panel

`ColorPanel` reads the selected element and targets a property per element type:

| Element | Target property |
| ------- | --------------- |
| square  | `stroke`  (border) |
| draw    | `stroke`  (line color) |
| text    | `fill`    (text color) |
| sticker | `fill`    (sticker background; also updates `activeStickerFill`) |

The mapping lives in `lib/interactions/colorize.ts`, so adding a swatch or a
new color-target type is a one-file change.

### 4.5 Text editing

`TextEditor` is a plain HTML `<textarea>` overlayed in **viewport coordinates**
(`position: fixed`) computed from the Konva node:

```
stageBox = stage.content.getBoundingClientRect()   // viewport origin of stage
absPos   = node.getAbsolutePosition()              // top-left in stage coords
left/top = stageBox + absPos
```

It works for **both** text elements and stickers (any `TextBearingElement`).
The overlay uses `position: fixed` and tracks the node in a
camera-dependent effect, so it stays glued to the element while you zoom/pan.

Commit rules: `Enter` commits, `Shift+Enter` inserts a newline, `Esc` cancels,
blur commits. A text element that was **placed empty and committed blank** is
removed again (no invisible boxes); otherwise empty input falls back to the
previous text (stickers keep their last note).

> **Immediate typing (Text / Sticker):** placing a text box drops the element
> empty with a `Type here…` placeholder and opens the editor immediately — no
> double-click. Stickers open with their default note **selected**, so the first
> keystroke replaces it. That is what "click and start writing" means for both
> tools.
>
> **Focus reliability (why Space used to be dropped):** the editor used to grab
> focus inside a `requestAnimationFrame` and `select()` all text. A fast first
> keystroke (e.g. Space) raced ahead of the focus frame and was lost to the
> stage. The editor now focuses **synchronously in `useLayoutEffect`**, so every
> keystroke — including Space — goes into the textarea. Because focus is
> synchronous, selecting all (stickers) is safe again.

## 5. Domain model (`src/types/canvas.ts`)

```ts
type ToolId = "select" | "square" | "text" | "draw" | "sticker";

interface SquareElement extends BaseElement {
  type: "square";
  width; height; fill; stroke; strokeWidth; cornerRadius;   // fill is "transparent"
}
interface TextElement extends BaseElement {
  type: "text";
  text; fontSize; fontFamily; fill; padding;
}
interface DrawElement extends BaseElement {
  type: "draw";
  points: ElementPosition[];    // relative to element.x/y (bounds baked on drop)
  stroke; strokeWidth; tension;
}
interface StickerElement extends BaseElement {
  type: "sticker";
  text; width; height; fontSize; fontFamily; fill; textFill; padding;
}
type CanvasElement = SquareElement | TextElement | DrawElement | StickerElement;
// BaseElement: id, x, y, rotation

interface Camera { x: number; y: number; scale: number; }
```

The union is discriminated by `type`. Factories live in `src/lib/elements.ts`
(`createSquare`, `createText`, `createDraw`, `createSticker`, `normalizeBox`,
`getBounds`, `flattenPoints`, `isClick`, `is*Element` guards) and all defaults
in `src/constants/canvas.tsx` so styles and sizes stay in one place.

## 6. Adding elements (recipe)

1. Extend the union in `types/canvas.ts` (new `type: "…"` member) + `ToolId`.
2. Add a factory + geometry helpers in `lib/elements.ts`, and defaults in
   `constants/canvas.tsx` (color, size, tool definition with label/icon).
3. Render a case in `ElementNode` (its own `<Group id={id}>`).
4. Put the creation/placement logic in `lib/interactions/canvas.ts`
   (`beginDraft`/`extendDraft`/`handleStagePointerDown`/`handleStagePointerUp`).
   Convert screen→world via `screenToWorld(camera)` before creating anything.
   The component does **not** change.
5. If it needs handles, extend `SelectionTransformer`; if it needs inline
   editing, mirror the `TextEditor` pattern (edit a `TextBearingElement`).

## 7. Next.js host wiring (reference)

```ts
// next.config.js — host
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, options) {
    const { isServer } = options;
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        remotes: {
          demos: `demos@${process.env.REMOTE_URL}/remoteEntry.js`,
        },
        shared: {},
      })
    );
    if (!isServer) config.output.publicPath = 'auto';
    return config;
  },
};
```

```tsx
// app/board/page.tsx — host (client component)
import dynamic from 'next/dynamic';

const CanvasBoard = dynamic(() => import('demos/DemosApp'), { ssr: false });

export default function BoardPage() {
  return <CanvasBoard />;
}
```

Notes:

- `ssr: false` — the canvas is client-only (Konva). SSR would need a portal/ref
  guard such as `typeof window !== 'undefined'`.
- The remote exposes only `./DemosApp` and is **self-contained**: it bundles
  its own React, so it never depends on a host-injected React instance.
- Different environments point `REMOTE_URL` at the deployed
  `remoteEntry.js` (e.g. Cloudflare Pages — the repo ships `wrangler.jsonc`).

## 8. Known issue: sharing `react` / `react-dom` in dev mode

If `react` / `react-dom` are added to the federation `shared` option, the
plugin rewrites every import of those packages through an async `loadShare`
bridge. On **Vite 8 (Rolldown optimizer)** the prebundled `react-dom/client`
wraps its internal `require('react-dom')` into the share module, whose named
exports are only populated inside an awaited `.then()` callback:

```js
// prebundled react-dom_client.js (broken shape)
var m = (init_..._loadShare_react_dom(), __toCommonJS(...exports)); // init is async
var i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;       // undefined
exports.createRoot = function(c, o) { i.usingClientEntryPoint = true; ... };
```

`init` returns a Promise that is discarded, so `__SECRET_INTERNALS_...` is
read as `undefined` and `createRoot` throws:
`TypeError: Cannot set properties of undefined (setting 'usingClientEntryPoint')`
→ blank page (reported upstream in module-federation/vite#297 / #501 / #603).

Resolutions:

- This repo **does not share React**: no `shared` entries, remote is
  self-contained. `react-dom/client` then stays on Vite's native prebundle and
  resolves `react-dom` directly — no race, works in dev and build.
- It is safe to keep the remote self-contained even when a Next.js host also
  ships React: the remote mounts and renders its own tree, and no fix-upgrade
  exists yet in `@module-federation/vite` (1.21.6 is the latest).

## 9. Future-proofing

- **Persistence/realtime:** `elements` and `camera` are JSON-serializable —
  persist to localStorage now; swap to a CRDT (Yjs) later without touching the
  renderer.
- **Multi-selection:** generalise `selectedId` to `Set<string>` in the store;
  `ElementNode` and `SelectionTransformer` are the only consumers.
- **Commands/undo:** wrap store mutations into a tiny command layer in `lib/`.
- **Zoom/pan** is already implemented (store `camera` + `lib/interactions/zoom.ts`).
  A minimap would read the same `camera` from the store.

## 10. SOLID: handler separation

Components render; **behaviour lives in dedicated modules**. This is the
project-wide rule introduced with the interaction refactor:

### The rule

Event handlers are centralised in `src/lib/interactions/` and consumed by
components. A component never implements interaction logic inline — it calls a
handler function (or spreads props returned by a thin hook).

### Module map (single responsibility)

| Module | Owns |
| ------ | ---- |
| `lib/interactions/canvas.ts`    | stage pointer state machine, wheel zoom, keyboard (Esc / Del / Space-pan), screen→world conversion, `ToolDraft` mutation (`beginDraft`/`extendDraft`) |
| `lib/interactions/elements.ts`  | per-element handlers (select, drag-end, start-edit) |
| `lib/interactions/transform.ts` | resize `transformEnd` (bake width/height back to store) |
| `lib/interactions/colorize.ts`  | which property a type colors + applying the color |
| `lib/interactions/textEdit.ts`  | commit / cancel of the inline text editor |
| `lib/interactions/export.ts`    | PNG and JSON download |
| `lib/interactions/zoom.ts`      | pure camera math (clamp, zoom-at-point, pan) |
| `lib/interactions/panKeys.ts`   | bookkeeping for "Space held → pan" |

Hooks under `src/hooks/` own **state** only and wire the pure handlers to
React/Konva:

- `useCanvasInteractions` — owns `draft`/`pan`/`panCandidate` `useState` and
  returns the `Stage` props (`onMouseDown`, …, `onWheel`).
- `useCanvasKeyboard` — registers `handleCanvasKeyDown/Up` on `window`.
- `useCanvasSize` — drives a `ResizeObserver`, returns stage size.

### How to add behaviour

1. Write a pure function in the right `lib/interactions/*` module (it may read
   `useCanvasStore.getState()` for the current state + actions).
2. If it needs component state, add a thin hook under `src/hooks/` that holds
   that state and returns handler props.
3. In the component, call `useCanvasInteraction()` (or import the handler
   function) and use the returned props — no logic in the JSX.

### Why

- **S**ingle responsibility: each module has one clear concern.
- **O/CP** open-closed: adding a tool = a new `ToolDraft` arm + `constants`
  entry + `ElementNode` case; existing handlers stay untouched.
- **L**iskov: element kinds are discriminated unions; nodes render without
  branching on side effects.
- **I**nterface segregation: components depend only on the handler props they
  use, not on the whole store.
- **D**ependency inversion: components depend on handler *interfaces*
  (functions), handlers depend on the store contract, never the reverse.