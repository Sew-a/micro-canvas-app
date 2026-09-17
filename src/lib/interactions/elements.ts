import type Konva from "konva";
import { useCanvasStore } from "../../store/canvasStore";

export function handleElementSelect(
  event: Konva.KonvaEventObject<Event>,
  id: string
): void {
  event.cancelBubble = true;
  useCanvasStore.getState().select(id);
}

export function handleElementDragEnd(
  event: Konva.KonvaEventObject<Event>,
  id: string
): void {
  useCanvasStore
    .getState()
    .updateElement(id, { x: event.target.x(), y: event.target.y() });
}

export function handleElementEdit(id: string): void {
  useCanvasStore.getState().setEditing(id);
}