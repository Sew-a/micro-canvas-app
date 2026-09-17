import { useCanvasStore } from "../../store/canvasStore";
import type { CanvasElement } from "../../types/canvas";

export type ColorTarget = "stroke" | "fill";

export function getColorTarget(element: CanvasElement): ColorTarget {
  return element.type === "square" || element.type === "draw"
    ? "stroke"
    : "fill";
}

export function getElementColor(element: CanvasElement): string {
  if (element.type === "square" || element.type === "draw") {
    return element.stroke;
  }
  return element.fill;
}

export function applyColorToElement(id: string, color: string): void {
  const store = useCanvasStore.getState();
  const element = store.elements.find((candidate) => candidate.id === id);
  if (!element) return;

  if (element.type === "square" || element.type === "draw") {
    store.updateElement(id, { stroke: color });
  } else if (element.type === "sticker") {
    store.updateElement(id, { fill: color });
    store.setActiveStickerFill(color);
  } else {
    store.updateElement(id, { fill: color });
  }
}