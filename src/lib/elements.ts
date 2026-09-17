import type {
  CanvasElement,
  DrawElement,
  ElementPosition,
  SquareElement,
  StickerElement,
  TextBearingElement,
  TextElement,
} from "../types/canvas";
import {
  DEFAULT_SQUARE_HEIGHT,
  DEFAULT_SQUARE_MIN,
  DEFAULT_SQUARE_WIDTH,
  DEFAULT_TEXT_FILL,
  DEFAULT_TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE,
  DEFAULT_TEXT_PADDING,
  DRAW_STROKE,
  DRAW_STROKE_WIDTH,
  DRAW_TENSION,
  ELEMENT_FILL,
  ELEMENT_STROKE,
  STICKER_DEFAULT_TEXT,
  STICKER_FONT_SIZE,
  STICKER_HEIGHT,
  STICKER_PADDING,
  STICKER_TEXT_FILL,
  STICKER_WIDTH,
} from "../constants/canvas";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
    text: "",
    fontSize: DEFAULT_TEXT_FONT_SIZE,
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fill: DEFAULT_TEXT_FILL,
    padding: DEFAULT_TEXT_PADDING,
  };
}

export function createDraw(points: ElementPosition[]): DrawElement | null {
  const bounds = getBounds(points);
  if (!bounds) return null;
  return {
    id: createElementId(),
    type: "draw",
    x: bounds.x,
    y: bounds.y,
    rotation: 0,
    points: points.map((point) => ({
      x: point.x - bounds.x,
      y: point.y - bounds.y,
    })),
    stroke: DRAW_STROKE,
    strokeWidth: DRAW_STROKE_WIDTH,
    tension: DRAW_TENSION,
  };
}

export function createSticker(
  position: ElementPosition,
  fill: string
): StickerElement {
  return {
    id: createElementId(),
    type: "sticker",
    x: position.x - STICKER_WIDTH / 2,
    y: position.y - STICKER_HEIGHT / 2,
    rotation: 0,
    text: STICKER_DEFAULT_TEXT,
    width: STICKER_WIDTH,
    height: STICKER_HEIGHT,
    fontSize: STICKER_FONT_SIZE,
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fill,
    textFill: STICKER_TEXT_FILL,
    padding: STICKER_PADDING,
  };
}

export function normalizeBox(start: ElementPosition, end: ElementPosition): Bounds {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return { x, y, width, height };
}

export function getBounds(points: ElementPosition[]): Bounds | null {
  if (points.length === 0) return null;
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function flattenPoints(points: ElementPosition[]): number[] {
  const flat: number[] = [];
  for (const point of points) flat.push(point.x, point.y);
  return flat;
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

export function isDrawElement(el: CanvasElement): el is DrawElement {
  return el.type === "draw";
}

export function isStickerElement(el: CanvasElement): el is StickerElement {
  return el.type === "sticker";
}

export function isTextBearingElement(
  el: CanvasElement
): el is TextBearingElement {
  return isTextElement(el) || isStickerElement(el);
}