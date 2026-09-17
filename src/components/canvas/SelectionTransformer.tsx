import { useEffect, useRef, type RefObject } from "react";
import type Konva from "konva";
import { Transformer } from "react-konva";
import { ACCENT_BLUE, DEFAULT_SQUARE_MIN } from "../../constants/canvas";
import { handleTransformEnd } from "../../lib/interactions/transform";
import { useCanvasStore } from "../../store/canvasStore";

interface SelectionTransformerProps {
  layerRef: RefObject<Konva.Layer | null>;
}

export function SelectionTransformer({ layerRef }: SelectionTransformerProps) {
  const selectedId = useCanvasStore((state) => state.selectedId);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const selectedElement = useCanvasStore((state) =>
    state.elements.find((element) => element.id === state.selectedId)
  );

  const transformerRef = useRef<Konva.Transformer>(null);

  const enabled = activeTool === "select" && selectedElement?.type === "square";

  useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer) return;

    if (enabled && selectedId) {
      const node = layer.findOne("#" + selectedId) ?? null;
      transformer.nodes([node].filter((n): n is Konva.Node => Boolean(n)));
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [enabled, selectedId, layerRef]);

  if (!enabled) return null;

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled={false}
      keepRatio={false}
      anchorSize={10}
      anchorCornerRadius={3}
      anchorStroke={ACCENT_BLUE}
      anchorFill="#ffffff"
      anchorStrokeWidth={1.5}
      borderStroke={ACCENT_BLUE}
      borderStrokeWidth={1.5}
      boundBoxFunc={(oldBox, newBox) =>
        newBox.width < DEFAULT_SQUARE_MIN || newBox.height < DEFAULT_SQUARE_MIN
          ? oldBox
          : newBox
      }
      onTransformEnd={() =>
        handleTransformEnd(transformerRef.current, selectedId)
      }
    />
  );
}