export type ToolId = "select" | "square" | "text" | "draw" | "sticker";

interface BaseElement {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export interface SquareElement extends BaseElement {
  type: "square";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  padding: number;
}

export interface DrawElement extends BaseElement {
  type: "draw";
  points: ElementPosition[];
  stroke: string;
  strokeWidth: number;
  tension: number;
}

export interface StickerElement extends BaseElement {
  type: "sticker";
  text: string;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  textFill: string;
  padding: number;
}

export type TextBearingElement = TextElement | StickerElement;

export type CanvasElement =
  | SquareElement
  | TextElement
  | DrawElement
  | StickerElement;

export interface ElementPosition {
  x: number;
  y: number;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}