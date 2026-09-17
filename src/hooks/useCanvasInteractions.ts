import { useState, type RefObject } from "react";
import type Konva from "konva";
import {
  handleStagePointerDown,
  handleStagePointerLeave,
  handleStagePointerMove,
  handleStagePointerUp,
  handleStageWheel,
  type PointerHandlersParams,
  type ToolDraft,
} from "../lib/interactions/canvas";
import type { ElementPosition } from "../types/canvas";

export function useCanvasInteractions(
  stageRef: RefObject<Konva.Stage | null>
) {
  const [draft, setDraft] = useState<ToolDraft | null>(null);
  const [pan, setPan] = useState<{ start: ElementPosition } | null>(null);
  const [panCandidate, setPanCandidate] = useState<ElementPosition | null>(null);

  const params: PointerHandlersParams = {
    stageRef,
    draft,
    setDraft,
    pan,
    setPan,
    panCandidate,
    setPanCandidate,
  };

  return {
    draft,
    handlePointerDown: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) =>
      handleStagePointerDown(params, event),
    handlePointerMove: () => handleStagePointerMove(params),
    handlePointerUp: () => handleStagePointerUp(params),
    handlePointerLeave: () => handleStagePointerLeave(params),
    handleWheel: (event: Konva.KonvaEventObject<globalThis.WheelEvent>) =>
      handleStageWheel(stageRef.current, event),
  };
}