import type Konva from "konva";
import type { RefObject } from "react";
import {
  DEFAULT_SQUARE_HEIGHT,
  DEFAULT_SQUARE_WIDTH,
  PAN_THRESHOLD,
  VIEWPORT_ZOOM_STEP,
} from "../../constants/canvas";
import {
  createDraw,
  createSquare,
  createSticker,
  createText,
  isClick,
  normalizeBox,
} from "../elements";
import { useCanvasStore } from "../../store/canvasStore";
import type { ElementPosition, ToolId } from "../../types/canvas";
import { isPanKeyDown, resetPanKey, setPanKeyDown } from "./panKeys";
import { panBy, screenToWorld, zoomAt } from "./zoom";

export type ToolDraft =
  | { kind: "square"; start: ElementPosition; current: ElementPosition }
  | { kind: "draw"; points: ElementPosition[] };

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "TEXTAREA" ||
    target.tagName === "INPUT" ||
    target.isContentEditable
  );
}

function stagePointerPosition(
  stage: Konva.Stage | null
): ElementPosition | null {
  const position = stage?.getPointerPosition();
  return position ? { x: position.x, y: position.y } : null;
}

export function beginDraft(
  tool: ToolId,
  position: ElementPosition
): ToolDraft | null {
  if (tool === "square") {
    return { kind: "square", start: position, current: position };
  }
  if (tool === "draw") {
    return { kind: "draw", points: [position] };
  }
  return null;
}

export function extendDraft(
  draft: ToolDraft,
  position: ElementPosition
): ToolDraft {
  if (draft.kind === "square") {
    return { ...draft, current: position };
  }
  return { kind: "draw", points: [...draft.points, position] };
}

export function handleCanvasKeyDown(event: KeyboardEvent): void {
  if (isEditableTarget(event.target)) return;
  if (event.key === " ") {
    setPanKeyDown(true);
    return;
  }
  const store = useCanvasStore.getState();
  if (event.key === "Escape") {
    store.select(null);
    store.setEditing(null);
    return;
  }
  if (event.key === "Backspace" || event.key === "Delete") {
    if (store.selectedId) store.removeElement(store.selectedId);
  }
}

export function handleCanvasKeyUp(event: KeyboardEvent): void {
  if (event.key === " ") resetPanKey();
}

export interface PointerHandlersParams {
  stageRef: RefObject<Konva.Stage | null>;
  draft: ToolDraft | null;
  setDraft: (draft: ToolDraft | null) => void;
  pan: { start: ElementPosition } | null;
  setPan: (pan: { start: ElementPosition } | null) => void;
  panCandidate: ElementPosition | null;
  setPanCandidate: (position: ElementPosition | null) => void;
}

export function handleStagePointerDown(
  params: PointerHandlersParams,
  event: Konva.KonvaEventObject<MouseEvent | TouchEvent>
): void {
  const stage = params.stageRef.current;
  const screenPosition = stagePointerPosition(stage);
  if (!screenPosition) return;

  const middleButton = event.evt instanceof MouseEvent && event.evt.button === 1;
  if (middleButton || isPanKeyDown()) {
    params.setPanCandidate(null);
    params.setPan({ start: screenPosition });
    return;
  }

  const store = useCanvasStore.getState();
  const tool = store.activeTool;

  if (tool === "select") {
    if (stage && event.target === stage) {
      params.setPanCandidate(screenPosition);
    }
    return;
  }

  const worldPosition = screenToWorld(screenPosition, store.camera);

  if (tool === "text") {
    const element = createText(worldPosition);
    store.addElement(element);
    store.setEditing(element.id);
    return;
  }

  if (tool === "sticker") {
    const element = createSticker(worldPosition, store.activeStickerFill);
    store.addElement(element);
    store.setEditing(element.id);
    return;
  }

  params.setDraft(beginDraft(tool, worldPosition));
}

export function handleStagePointerMove(
  params: PointerHandlersParams
): void {
  const position = stagePointerPosition(params.stageRef.current);
  if (!position) return;

  if (params.pan) {
    const store = useCanvasStore.getState();
    const dx = position.x - params.pan.start.x;
    const dy = position.y - params.pan.start.y;
    store.setCamera(panBy(store.camera, dx, dy));
    params.setPan({ start: position });
    return;
  }

  if (params.panCandidate) {
    const moved =
      Math.abs(position.x - params.panCandidate.x) >= PAN_THRESHOLD ||
      Math.abs(position.y - params.panCandidate.y) >= PAN_THRESHOLD;
    if (moved) {
      params.setPan({ start: params.panCandidate });
      params.setPanCandidate(null);
    }
    return;
  }

  if (params.draft) {
    const worldPosition = screenToWorld(
      position,
      useCanvasStore.getState().camera
    );
    params.setDraft(extendDraft(params.draft, worldPosition));
  }
}

export function handleStagePointerUp(
  params: PointerHandlersParams
): void {
  if (params.pan) {
    params.setPan(null);
    return;
  }
  if (params.panCandidate) {
    useCanvasStore.getState().select(null);
    params.setPanCandidate(null);
    return;
  }

  const draft = params.draft;
  if (!draft) return;
  params.setDraft(null);

  const store = useCanvasStore.getState();
  if (draft.kind === "square") {
    if (isClick(draft.start, draft.current)) {
      store.addElement(
        createSquare(
          draft.start.x - DEFAULT_SQUARE_WIDTH / 2,
          draft.start.y - DEFAULT_SQUARE_HEIGHT / 2
        )
      );
    } else {
      const box = normalizeBox(draft.start, draft.current);
      store.addElement(
        createSquare(
          box.x,
          box.y,
          Math.max(box.width, 4),
          Math.max(box.height, 4)
        )
      );
    }
    return;
  }

  if (draft.kind === "draw" && draft.points.length >= 2) {
    const element = createDraw(draft.points);
    if (element) store.addElement(element);
  }
}

export function handleStagePointerLeave(params: PointerHandlersParams): void {
  params.setDraft(null);
  params.setPan(null);
  params.setPanCandidate(null);
}

export function handleStageWheel(
  stage: Konva.Stage | null,
  event: Konva.KonvaEventObject<globalThis.WheelEvent>
): void {
  event.evt.preventDefault();
  const pointer = stage?.getPointerPosition();
  if (!pointer) return;
  const factor =
    event.evt.deltaY < 0 ? VIEWPORT_ZOOM_STEP : 1 / VIEWPORT_ZOOM_STEP;
  const store = useCanvasStore.getState();
  store.setCamera(zoomAt(store.camera, factor, pointer));
}