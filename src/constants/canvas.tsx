import type { ReactNode } from "react";
import type { ToolId } from "../types/canvas";

export const ACCENT_BLUE = "#4262ff";
export const CANVAS_BACKGROUND = "#1b1e26";
export const GRID_COLOR = "#2b303c";
export const GRID_SIZE = 28;
export const MIN_GRID_SPACING = 14;

export const DEFAULT_SQUARE_WIDTH = 160;
export const DEFAULT_SQUARE_HEIGHT = 120;
export const DEFAULT_SQUARE_MIN = 16;

export const TEXT_PLACEHOLDER = "Type here…";
export const DEFAULT_TEXT_FONT_SIZE = 18;
export const DEFAULT_TEXT_FONT_FAMILY =
  "system-ui, 'Segoe UI', Roboto, sans-serif";
export const DEFAULT_TEXT_FILL = "#e8eaf1";
export const DEFAULT_TEXT_PADDING = 10;

export const ELEMENT_STROKE = "#8a90a0";
export const ELEMENT_FILL = "transparent";

export const DRAW_STROKE = "#eaeef7";
export const DRAW_STROKE_WIDTH = 3;
export const DRAW_TENSION = 0.4;

export const STICKER_WIDTH = 170;
export const STICKER_HEIGHT = 150;
export const STICKER_FONT_SIZE = 15;
export const STICKER_PADDING = 12;
export const STICKER_TEXT_FILL = "#1c1e26";
export const STICKER_DEFAULT_TEXT = "Add your note";
export const STICKER_FILLS = ["#fde047", "#86efac", "#7dd3fc", "#f9a8d4"];

export const COLOR_PALETTE = [
  "#4262ff",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#06b6d4",
  "#eaeef7",
  ...STICKER_FILLS,
];

export const VIEWPORT_MIN_SCALE = 0.15;
export const VIEWPORT_MAX_SCALE = 5;
export const VIEWPORT_ZOOM_STEP = 1.1;
export const PAN_THRESHOLD = 5;

interface ToolDefinition {
  id: ToolId;
  label: string;
  hint: string;
  icon: ReactNode;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: "select",
    label: "Select",
    hint: "Click to select, drag to move",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l5 16 2.6-5.4L18 11 5 3z" />
        <path d="M12.6 13.6L18 19" />
      </svg>
    ),
  },
  {
    id: "square",
    label: "Square",
    hint: "Drag to draw or click to drop",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" strokeWidth="1.4">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    hint: "Click and start typing",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5h12M12 5v14" />
        <path d="M9 19h6" />
      </svg>
    ),
  },
  {
    id: "draw",
    label: "Draw",
    hint: "Drag to draw freehand",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    id: "sticker",
    label: "Sticker",
    hint: "Click and start typing",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9l-5-5z" />
        <path d="M15 4v4h4" />
        <path d="M8 12h8M8 16h5" />
      </svg>
    ),
  },
];