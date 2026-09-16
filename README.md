# Canvas — Miro-like whiteboard micro-frontend

**Canvas** is a Miro-like whiteboard / infinite-canvas micro-frontend built with
React 18, TypeScript, and Vite. The whiteboard itself is rendered with
**Konva** (via `react-konva`) and its state is managed with **Zustand**.

It ships as a **Module Federation remote** and is designed to be embedded
inside a **Next.js host application** via the `./DemosApp` exposed entry.

---

## What this project is

- A single, self-contained canvas experience (tools panel + draggable board).
- Today it supports: dropping **squares** (click or drag-to-draw), dropping
  **text** boxes (click, then double-click to type), selecting / moving /
  resizing / deleting elements, and keyboard shortcuts.
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
      CanvasStage.tsx             Konva Stage, pointer logic, draw preview
      GridBackground.tsx          dot-graph paper look
      ElementNode.tsx             renders a square or text node
      SelectionTransformer.tsx    resize handles for selected squares
      TextEditor.tsx              inline textarea overlay for editing text
    toolbox/
      Toolbar.tsx                 left tools panel
  constants/canvas.tsx            defaults, palette, tool definitions
  lib/elements.ts                 element factories, geometry helpers
  store/canvasStore.ts            Zustand board store
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

- Grid canvas with a Miro-like look.
- **Select** (V) — click to select, drag to move, resize squares via handles,
  `Del`/`Backspace` to remove, click empty space to deselect.
- **Square** (R) — click to drop a default square, or drag to draw a custom one.
- **Text** (T) — click to drop a text box, then double-click (in Select mode)
  to type with the inline editor. `Enter` commits, `Esc` cancels.
- Touch support (pointer events mapped to mouse events).

## Roadmap

- Multi-select, group + z-ordering, copy/paste, duplicate.
- Zoom & pan (infinite canvas), minimap.
- More shapes (arrows/lines, sticky notes, images).
- Element styling inspector + color palette.
- Persistence layer (localStorage → backend sync / CRDT).
- Collaborative multi-cursor sessions.

See [docs/architecture.md](docs/architecture.md) for the full technical
architecture.