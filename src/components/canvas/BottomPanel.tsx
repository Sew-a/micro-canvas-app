import type { RefObject } from "react";
import type Konva from "konva";
import { VIEWPORT_ZOOM_STEP } from "../../constants/canvas";
import { exportBoardToJson, exportStageToPng } from "../../lib/interactions/export";
import { zoomAt } from "../../lib/interactions/zoom";
import { useCanvasStore } from "../../store/canvasStore";

interface BottomPanelProps {
  stageRef: RefObject<Konva.Stage | null>;
  size: { width: number; height: number };
}

export function BottomPanel({ stageRef, size }: BottomPanelProps) {
  const camera = useCanvasStore((state) => state.camera);
  const elementCount = useCanvasStore((state) => state.elements.length);

  const zoomAtCenter = (factor: number) => {
    const center = { x: size.width / 2, y: size.height / 2 };
    useCanvasStore.getState().setCamera(zoomAt(camera, factor, center));
  };

  const resetZoom = () =>
    useCanvasStore.getState().setCamera({ x: 0, y: 0, scale: 1 });

  const exportPng = () => exportStageToPng(stageRef.current);
  const exportJson = () => exportBoardToJson(useCanvasStore.getState().elements);

  return (
    <div className="bottom-panel" role="toolbar" aria-label="Canvas controls">
      <div className="bottom-group">
        <span className="bottom-label">Zoom</span>
        <button
          type="button"
          className="panel-btn"
          aria-label="Zoom out"
          onClick={() => zoomAtCenter(1 / VIEWPORT_ZOOM_STEP)}
        >
          −
        </button>
        <span className="zoom-value">{Math.round(camera.scale * 100)}%</span>
        <button
          type="button"
          className="panel-btn"
          aria-label="Zoom in"
          onClick={() => zoomAtCenter(VIEWPORT_ZOOM_STEP)}
        >
          +
        </button>
        <button type="button" className="panel-btn" onClick={resetZoom}>
          Reset
        </button>
      </div>

      <div className="bottom-group">
        <button type="button" className="panel-btn" onClick={exportPng}>
          PNG
        </button>
        <button type="button" className="panel-btn" onClick={exportJson}>
          JSON
        </button>
      </div>

      <div className="bottom-meta">
        {elementCount} element{elementCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}