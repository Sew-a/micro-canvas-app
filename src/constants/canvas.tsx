import type { ReactNode } from "react";
import type { ToolId } from "../types/canvas";

export const ACCENT_BLUE = "#4262ff";
export const CANVAS_BACKGROUND = "#f6f7fb";
export const GRID_COLOR = "#e8eaf2";
export const GRID_SIZE = 28;

export const DEFAULT_SQUARE_WIDTH = 160;
export const DEFAULT_SQUARE_HEIGHT = 120;
export const DEFAULT_SQUARE_MIN = 16;

export const DEFAULT_TEXT = "Double-click to edit";
export const DEFAULT_TEXT_FONT_SIZE = 18;
export const DEFAULT_TEXT_FONT_FAMILY =
  "system-ui, 'Segoe UI', Roboto, sans-serif";
export const DEFAULT_TEXT_FILL = "#1f2329";
export const DEFAULT_TEXT_PADDING = 10;

export const ELEMENT_STROKE = "#c9cdd4";
export const ELEMENT_FILL = "#ffffff";

interface ToolDefinition {
  id: ToolId;
  label: string;
  shortcut: string;
  hint: string;
  icon: ReactNode;
}

export const TOOLS: ToolDefinition[] = [
  {
    id: "select",
    label: "Select",
    shortcut: "V",
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
    shortcut: "R",
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
    shortcut: "T",
    hint: "Click to drop a text box",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5h12M12 5v14" />
        <path d="M9 19h6" />
      </svg>
    ),
  },
];