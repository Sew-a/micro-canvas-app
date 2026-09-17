import type Konva from "konva";
import { DEFAULT_SQUARE_MIN } from "../../constants/canvas";
import { useCanvasStore } from "../../store/canvasStore";

export function handleTransformEnd(
  transformer: Konva.Transformer | null,
  selectedId: string | null
): void {
  if (!transformer || !selectedId) return;
  const node = transformer.nodes()[0];
  if (!node || !node.isVisible()) return;

  const box = node.getClientRect({ relativeTo: node.getParent() ?? undefined });

  node.scaleX(1);
  node.scaleY(1);

  const width = Math.max(DEFAULT_SQUARE_MIN, box.width);
  const height = Math.max(DEFAULT_SQUARE_MIN, box.height);
  useCanvasStore.getState().updateElement(selectedId, {
    x: box.x,
    y: box.y,
    width,
    height,
  });
  transformer.getLayer()?.batchDraw();
}