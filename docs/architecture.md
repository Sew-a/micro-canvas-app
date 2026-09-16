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

The board is a set of stacked Konva layers inside one `<Stage>`:

```
Stage (fills .canvas-stage-host)
├── Layer "grid"        → GridBackground  (rect + dot-grid lines, listening=false)
├── Layer "elements"    → one Group per element (draggable/clickable)
│                          ├── <Rect/>  for squares
│                          ├── <Text/>  (+ selection rect) for text
│                          └── SelectionTransformer (squares only)
└── HTML overlay        → TextEditor <textarea> (fixed-position, above the stage)
```

Design rules:

- **Grid layer is inert** (`listening={false}`) so empty-space clicks always
  reach the `Stage` and can be used for deselect.
- **Elements are interactive only in Select mode** (`listening = activeTool === 'select'`).
  While a creation tool (Square / Text) is active, clicks pass through to the
  stage and create new elements instead of selecting existing ones.
- **Each element Group carries `id = element.id`** so Konva can locate it via
  `layer.findOne("#<id>")` for the Transformer and the text editor geometry.

## 3. State management (Zustand)

One global store, `src/store/canvasStore.ts`. Vanilla Zustand (`create`), no
middleware — all state is plain, serializable JSON (ready for persistence).

```
CanvasState {
  elements:      CanvasElement[]          // board content
  selectedId:    string | null
  editingId:     string | null            // text box currently edited
  activeTool:    "select" | "square" | "text"

  addElement(el)          // push + select it
  updateElement(id, patch)
  removeElement(id)       // clears selection/editing if targeted
  select(id | null)
  setEditing(id | null)
  setActiveTool(tool)
}
```

Selection and tool state sit next to element data because the pointer system
(compare Tool 4) needs them **synchronously at event time** — components read
the store via hooks for rendering, and the stage reads
`useCanvasStore.getState()` imperatively inside handlers.

## 4. Interaction flow

### 4.1 Creation (Square / Text tools)

```
down on stage ──► position captured via stage.getPointerPosition()
   │
   ├─ "square" ──► drawing rect recorded (start, current)
   │                move → preview dashed Rect rendered from store-agnostic local state
   │                up   → if click (Δ < MIN)  → drop default 160×120 square centered
   │                       else                → create square from drawn bounds
   │
   └─ "text"   ──► addElement(createText(pos)) + setEditing(id) → inline editor opens
```

Tool stays active after creation so the user can drop several elements in a row.

### 4.2 Selection + manipulation (Select tool)

- Click element → `select(id)`, `cancelBubble` prevents stage deselect.
- Click empty space → stage target → `select(null)`.
- Drag element → Konva DnD → `updateElement(id, { x, y })` on dragend.
- Resize square → Konva `Transformer` attached to the element Group.
  On `transformEnd` the Group scale is read (`node.getClientRect()`), reset to
  1, and the baked `width`/`height` written back to the store. Never relies on
  the Transformer's internal scale persisting.
- `Del` / `Backspace` → `removeElement`. `Esc` → deselect (and close editor).

### 4.3 Text editing

`TextEditor` is a plain HTML `<textarea>` overlayed in **viewport coordinates**
(`position: fixed`) computed from the Konva node:

```
stageBox = stage.content.getBoundingClientRect()   // viewport origin of stage
absPos   = node.getAbsolutePosition()              // top-left in stage coords
left/top = stageBox + absPos
```

Commit rules: `Enter` commits, `Shift+Enter` inserts a newline, `Esc` cancels,
blur commits. Empty input falls back to the previous text.

## 5. Domain model (`src/types/canvas.ts`)

```ts
type ToolId = "select" | "square" | "text";

interface SquareElement extends BaseElement {
  type: "square";
  width; height; fill; stroke; strokeWidth; cornerRadius;
}
interface TextElement extends BaseElement {
  type: "text";
  text; fontSize; fontFamily; fill; padding;
}
type CanvasElement = SquareElement | TextElement;
// BaseElement: id, x, y, rotation
```

The union is discriminated by `type`. Factories live in `src/lib/elements.ts`
(`createSquare`, `createText`, `normalizeBox`, `isClick`, `isSquareElement`,
`isTextElement`) and all defaults in `src/constants/canvas.tsx` so styles and
sizes stay in one place.

## 6. Adding elements (recipe)

1. Extend the union in `types/canvas.ts` (new `type: "…"` member).
2. Add a factory + geometry helpers in `lib/elements.ts`.
3. Render a case in `ElementNode` (its own `<Group id={id}>`).
4. Extend the tool registry in `constants/canvas.tsx` (label, icon, shortcut,
   hint) and the shortcut map + pointer handler in `CanvasStage`.
5. If it needs handles, extend `SelectionTransformer`; if it needs inline
   editing, mirror the `TextEditor` pattern.

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

- **Zoom/pan (infinite canvas):** add `scale{x,y}` + absolute offset to the
  store and a single `Stage` `onWheel`/`onDrag` handler; all pointer math already
  runs through `getPointerPosition()`, which is scale-aware.
- **Persistence/realtime:** `elements` is JSON-serializable — persist to
  localStorage now; swap to a CRDT (Yjs) later without touching the renderer.
- **Multi-selection:** generalise `selectedId` to `Set<string>` in the store;
  `ElementNode` and `SelectionTransformer` are the only consumers.
- **Commands/undo:** wrap store mutations into a tiny command layer in `lib/`.