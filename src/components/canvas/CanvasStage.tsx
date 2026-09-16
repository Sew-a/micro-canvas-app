import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Layer, Rect, Stage } from "react-konva";
import {
  ACCENT_BLUE,
  DEFAULT_SQUARE_HEIGHT,
  DEFAULT_SQUARE_WIDTH,
} from "../../constants/canvas";
import {
  createSquare,
  createText,
  isClick,
  normalizeBox,
} from "../../lib/elements";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementPosition, ToolId } from "../../types/canvas";
import { ElementNode } from "./ElementNode";
import { GridBackground } from "./GridBackground";
import { SelectionTransformer } from "./SelectionTransformer";
import { TextEditor } from "./TextEditor";

interface DrawState {
  start: ElementPosition;
  current: ElementPosition;
}

const EDIT_SHORTCUTS: Record<string, ToolId> = {
  v: "select",
  r: "square",
  t: "text",
};

export function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [size, setSize] = useState({ width: 900, height: 600 });
  const [drawing, setDrawing] = useState<DrawState | null>(null);

  const elements = useCanvasStore((state) => state.elements);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const addElement = useCanvasStore((state) => state.addElement);
  const select = useCanvasStore((state) => state.select);
  const setEditing = useCanvasStore((state) => state.setEditing);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () =>
      setSize({ width: container.clientWidth, height: container.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const store = useCanvasStore.getState();
      const tool = EDIT_SHORTCUTS[event.key.toLowerCase()];
      if (tool) {
        store.setActiveTool(tool);
        return;
      }
      if (event.key === "Escape") {
        store.select(null);
        store.setEditing(null);
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete") {
        if (store.selectedId) {
          store.removeElement(store.selectedId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getPointer = (): ElementPosition | null => {
    const position = stageRef.current?.getPointerPosition();
    return position ? { x: position.x, y: position.y } : null;
  };

  const handlePointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    if (activeTool === "select") {
      if (event.target === event.target.getStage()) select(null);
      return;
    }
    const position = getPointer();
    if (!position) return;

    if (activeTool === "square") {
      setDrawing({ start: position, current: position });
    } else if (activeTool === "text") {
      const element = createText(position);
      addElement(element);
      setEditing(element.id);
    }
  };

  const handlePointerMove = () => {
    if (!drawing) return;
    const position = getPointer();
    if (position) setDrawing({ start: drawing.start, current: position });
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    if (isClick(drawing.start, drawing.current)) {
      addElement(
        createSquare(
          drawing.start.x - DEFAULT_SQUARE_WIDTH / 2,
          drawing.start.y - DEFAULT_SQUARE_HEIGHT / 2
        )
      );
    } else {
      const box = normalizeBox(drawing.start, drawing.current);
      addElement(
        createSquare(
          box.x,
          box.y,
          Math.max(box.width, 4),
          Math.max(box.height, 4)
        )
      );
    }
    setDrawing(null);
  };

  const preview = drawing ? normalizeBox(drawing.start, drawing.current) : null;

  return (
    <div className="canvas-stage-host" ref={containerRef}>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={handlePointerDown}
        onMousemove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => setDrawing(null)}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <Layer>
          <GridBackground width={size.width} height={size.height} />
        </Layer>
        <Layer ref={layerRef}>
          {elements.map((element) => (
            <ElementNode key={element.id} element={element} />
          ))}
          {drawing && preview && (
            <Rect
              x={preview.x}
              y={preview.y}
              width={preview.width}
              height={preview.height}
              fill="rgba(66, 98, 255, 0.08)"
              stroke={ACCENT_BLUE}
              strokeWidth={1.5}
              dash={[6, 4]}
            />
          )}
          <SelectionTransformer layerRef={layerRef} />
        </Layer>
      </Stage>
      <TextEditor stageRef={stageRef} />
    </div>
  );
}