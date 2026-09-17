# Canvas — Miro-like whiteboard micro-frontend

**Canvas** is a Miro-like whiteboard / infinite-canvas micro-frontend built with
React 18, TypeScript, and Vite. The whiteboard itself is rendered with
**Konva** (via `react-konva`) and its state is managed with **Zustand**.

It ships as a **Module Federation remote** and is designed to be embedded
inside a **Next.js host application** via the `./DemosApp` exposed entry.

---

## What this project is

- A single, self-contained canvas experience (tools panel + draggable board).
- Today it supports: **squares** (click or drag-to-draw, transparent fill),
  **freehand drawing**, **text** boxes (click, then type with the inline
  editor), **colored stickers** (click to place, double-click to edit text),
  selecting / moving / resizing / deleting elements, a **color panel** that
appears when an element is selected, **zoom & pan** on an infinite dark grid,
**export to PNG / JSON**, and `Esc`/`Del` editing keys.
- Architecturally it is a **remote micro-frontend**: the whiteboard UI is
  developed and deployed independently, then composed into a Next.js shell
  at runtime through webpack/vite Module Federation.

The canvas is intentionally decoupled from any host routing, data fetching, or
server — all board state lives in a single Zustand store and is ready to be
persisted or synced in a future step.

## Tech stack

| Concern        | Choice                                        |
| -------------- | --------------------------------------------- |
| UI framework   | React 18 + TypeScript                         |
| Build tool     | Vite 8 + `@module-federation/vite`            |
| Canvas         | Konva + `react-konva`                         |
| State          | Zustand (single canvas store)                 |
| Host integration | Next.js (any) via Module Federation `remoteEntry.js` |

## Project structure

```
src/
  App.tsx                         layout shell (toolbar + stage)
  main.tsx                        entry
  components/
    canvas/
      CanvasStage.tsx             Konva Stage; wires hooks (no inline logic)
      GridBackground.tsx          screen-fixed infinite dark grid, camera-aware
      ElementNode.tsx             renders a square / draw / text / sticker node
      SelectionTransformer.tsx    resize handles for selected squares
      TextEditor.tsx              inline textarea overlay for editing text
      ColorPanel.tsx              floating color panel (top-left) on selection
      BottomPanel.tsx             bottom bar: zoom controls + export buttons
    toolbox/
      Toolbar.tsx                 left tools panel
  constants/canvas.tsx            defaults, palette, tool definitions
  hooks/
    useCanvasSize.ts              ResizeObserver -> stage size
    useCanvasInteractions.ts      draft/pan state machine (pointer + wheel)
    useCanvasKeyboard.ts          global keys: Esc deselect, Del remove, Space pan
  lib/
    elements.ts                   element factories, geometry helpers
    interactions/
      canvas.ts                   stage pointer/keyboard/wheel handlers
      elements.ts                 element select / drag / edit handlers
      transform.ts                resize transform-end handler
      colorize.ts                 color target + apply-color logic
      textEdit.ts                 commit / cancel text editing
      export.ts                   PNG + JSON export
      zoom.ts                     camera math (zoom around point, pan)
      panKeys.ts                  space-to-pan key flag
  store/canvasStore.ts            Zustand board + camera store
  types/canvas.ts                 domain types (ToolId, CanvasElement, ...)
```

## Getting started

```bash
npm install          # install dependencies
npm run dev          # dev server on http://localhost:3001
npm run build        # typecheck + production build to dist/
npm run preview      # preview the production build
```

Lint (flat config, ESLint 10):

```bash
npx eslint src
```

## Next.js integration

This repo stays a Vite remote. A Next.js **host** app consumes it at runtime
through the generated `dist/remoteEntry.js`.

The remote is **self-contained** — it bundles its own `react` / `react-dom`
instead of declaring them as federated `shared` singletons. This avoids a known
dev-mode crash in `@module-federation/vite` 1.x on Vite 8/Rolldown
(`TypeError: Cannot set properties of undefined (setting
'usingClientEntryPoint')`). It also decouples the remote from the host's React
version entirely. See `docs/architecture.md` §8 for details and the upstream
issue references.

```ts
// next.config.js (host)  — see docs/architecture.md for the complete snippet
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        remotes: { demos: `demos@${process.env.REMOTE_URL}/remoteEntry.js` },
      })
    );
    return config;
  },
};
```

```tsx
// pages/board.tsx (host)
import dynamic from 'next/dynamic';

const Board = dynamic(() => import('demos/DemosApp'), { ssr: false });
export default () => <Board />;
```

## Current features

- Dark-themed, Miro-like infinite canvas with a screen-fixed dotted grid.
- **Select** — click to select, drag to move, resize squares via handles,
  `Del`/`Backspace` to remove, click empty space to deselect.
- **Square** — click to drop a default square, or drag to draw a custom one
  (transparent fill, so the grid shows through).
- **Draw** — drag freehand on the canvas to draw lines.
- **Text** — click and start typing: the inline editor opens immediately.
  `Enter` commits, `Esc` cancels, `Shift+Enter` inserts a newline. The editor
  gains focus synchronously so the very first keystroke (including space) is
  captured; an empty committed box is discarded.
- **Sticker** — click, then start typing right away: the editor opens
  immediately with the default note selected so your first keystroke replaces
  it. Double-click any existing sticker to re-edit.
- **Color panel** — after adding or selecting a shape, a panel appears at the
  top-left of the canvas. It colors the **border** for squares, the **lines**
  for drawings, the **text** for text nodes and the **fill** for stickers.
- **Zoom & pan** — mouse wheel zooms around the cursor (zooming out reveals
  more of the infinite board), drag empty space or hold **Space** (or middle
  button) to pan; the bottom panel has `−`/`+`/`Reset` zoom controls. Drawing
  and placement are always relative to the cursor, at any zoom level.
- **Export** — bottom panel **PNG** downloads the board as an image, **JSON**
  downloads the board state as a file.
- Touch support (pointer events mapped to mouse events).

## Code organization (SOLID handlers)

Event handlers are **not** defined inline in components. Each interaction
concern lives in its own module under `src/lib/interactions/` (single
responsibility), and components only wire them up:

- stage pointer / keyboard / wheel logic → `lib/interactions/canvas.ts`
- element select / drag / edit → `lib/interactions/elements.ts`
- resize → `lib/interactions/transform.ts`
- colorizing → `lib/interactions/colorize.ts`
- text commit / cancel → `lib/interactions/textEdit.ts`
- export → `lib/interactions/export.ts`
- camera math → `lib/interactions/zoom.ts`

`CanvasStage.tsx` stays a thin shell: it reads store state, mounts layers, and
spreads handler props returned by hooks (`useCanvasInteractions`,
`useCanvasKeyboard`, `useCanvasSize`). See `docs/architecture.md` §10 for the
recipe and rules.

## Roadmap

- Multi-select, group + z-ordering, copy/paste, duplicate.
- Minimap, per-element font / stroke-width styling.
- Persistence layer (localStorage → backend sync / CRDT).
- Collaborative multi-cursor sessions.

See [docs/architecture.md](docs/architecture.md) for the full technical
architecture.