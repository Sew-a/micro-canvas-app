import { useEffect, useRef } from "react";
import type Konva from "konva";
import { Layer, Line, Rect, Stage } from "react-konva";
import {
  ACCENT_BLUE,
  DRAW_STROKE,
  DRAW_STROKE_WIDTH,
  DRAW_TENSION,
} from "../../constants/canvas";
import { flattenPoints, normalizeBox } from "../../lib/elements";
import { useCanvasStore } from "../../store/canvasStore";
import { useCanvasInteractions } from "../../hooks/useCanvasInteractions";
import { useCanvasKeyboard } from "../../hooks/useCanvasKeyboard";
import { useCanvasSize } from "../../hooks/useCanvasSize";
import { BottomPanel } from "./BottomPanel";
import { ColorPanel } from "./ColorPanel";
import { ElementNode } from "./ElementNode";
import { GridBackground } from "./GridBackground";
import { SelectionTransformer } from "./SelectionTransformer";
import { TextEditor } from "./TextEditor";

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const size = useCanvasSize(containerRef);
  const camera = useCanvasStore((state) => state.camera);
  const elements = useCanvasStore((state) => state.elements);

  const interactions = useCanvasInteractions(stageRef);
  useCanvasKeyboard();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventFocusSteal = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".konvajs-content")) {
        event.preventDefault();
      }
    };
    container.addEventListener("mousedown", preventFocusSteal, true);
    return () =>
      container.removeEventListener("mousedown", preventFocusSteal, true);
  }, []);

  const previewRect =
    interactions.draft?.kind === "square" && interactions.draft
      ? normalizeBox(
          interactions.draft.start,
          interactions.draft.current
        )
      : null;
  const previewDraw =
    interactions.draft?.kind === "draw" ? interactions.draft.points : null;

  return (
    <div className="canvas-stage-host" ref={containerRef}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onMouseDown={interactions.handlePointerDown}
        onMousemove={interactions.handlePointerMove}
        onMouseUp={interactions.handlePointerUp}
        onMouseLeave={interactions.handlePointerLeave}
        onTouchStart={interactions.handlePointerDown}
        onTouchMove={interactions.handlePointerMove}
        onTouchEnd={interactions.handlePointerUp}
        onWheel={interactions.handleWheel}
      >
        <Layer>
          <GridBackground width={size.width} height={size.height} camera={camera} />
        </Layer>
        <Layer ref={layerRef}>
          {elements.map((element) => (
            <ElementNode key={element.id} element={element} />
          ))}
          {previewRect && (
            <Rect
              x={previewRect.x}
              y={previewRect.y}
              width={previewRect.width}
              height={previewRect.height}
              fill="rgba(66, 98, 255, 0.08)"
              stroke={ACCENT_BLUE}
              strokeWidth={1.5}
              dash={[6, 4]}
            />
          )}
          {previewDraw && previewDraw.length > 1 && (
            <Line
              points={flattenPoints(previewDraw)}
              stroke={DRAW_STROKE}
              strokeWidth={DRAW_STROKE_WIDTH}
              tension={DRAW_TENSION}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <SelectionTransformer layerRef={layerRef} />
        </Layer>
      </Stage>
      <TextEditor stageRef={stageRef} />
      <ColorPanel />
      <BottomPanel stageRef={stageRef} size={size} />
    </div>
  );
}