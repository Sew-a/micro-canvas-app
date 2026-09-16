export type ToolId = "select" | "square" | "text";

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

export type CanvasElement = SquareElement | TextElement;

export interface ElementPosition {
  x: number;
  y: number;
}