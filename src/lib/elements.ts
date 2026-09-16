import type {
  CanvasElement,
  ElementPosition,
  SquareElement,
  TextElement,
} from "../types/canvas";
import {
  DEFAULT_SQUARE_HEIGHT,
  DEFAULT_SQUARE_MIN,
  DEFAULT_SQUARE_WIDTH,
  DEFAULT_TEXT,
  DEFAULT_TEXT_FILL,
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_PADDING,
  ELEMENT_FILL,
  ELEMENT_STROKE,
} from "../constants/canvas";

export function createElementId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSquare(
  x: number,
  y: number,
  width = DEFAULT_SQUARE_WIDTH,
  height = DEFAULT_SQUARE_HEIGHT
): SquareElement {
  return {
    id: createElementId(),
    type: "square",
    x,
    y,
    rotation: 0,
    width,
    height,
    fill: ELEMENT_FILL,
    stroke: ELEMENT_STROKE,
    strokeWidth: 1.5,
    cornerRadius: 4,
  };
}

export function createText(position: ElementPosition): TextElement {
  return {
    id: createElementId(),
    type: "text",
    x: position.x,
    y: position.y,
    rotation: 0,
    text: DEFAULT_TEXT,
    fontSize: DEFAULT_TEXT_FONT_SIZE,
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fill: DEFAULT_TEXT_FILL,
    padding: DEFAULT_TEXT_PADDING,
  };
}

export function normalizeBox(start: ElementPosition, end: ElementPosition) {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { x, y, width, height };
}

export function isClick(start: ElementPosition, end: ElementPosition): boolean {
  return (
    Math.abs(end.x - start.x) < DEFAULT_SQUARE_MIN &&
    Math.abs(end.y - start.y) < DEFAULT_SQUARE_MIN
  );
}

export function isSquareElement(el: CanvasElement): el is SquareElement {
  return el.type === "square";
}

export function isTextElement(el: CanvasElement): el is TextElement {
  return el.type === "text";
}