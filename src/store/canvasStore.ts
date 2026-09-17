import { create } from "zustand";
import { STICKER_FILLS } from "../constants/canvas";
import type { Camera, CanvasElement, ToolId } from "../types/canvas";

export interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  editingId: string | null;
  activeTool: ToolId;
  camera: Camera;
  activeStickerFill: string;
  setActiveTool: (tool: ToolId) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  select: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  setCamera: (patch: Partial<Camera>) => void;
  setActiveStickerFill: (fill: string) => void;
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  elements: [],
  selectedId: null,
  editingId: null,
  activeTool: "select",
  camera: { x: 0, y: 0, scale: 1 },
  activeStickerFill: STICKER_FILLS[0],

  setActiveTool: (tool) => set({ activeTool: tool }),

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
      selectedId: element.id,
    })),

  updateElement: (id, patch) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id
          ? ({ ...element, ...patch } as CanvasElement)
          : element
      ),
    })),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      editingId: state.editingId === id ? null : state.editingId,
    })),

  select: (id) => set({ selectedId: id }),

  setEditing: (id) => set({ editingId: id }),

  setCamera: (patch) =>
    set((state) => ({ camera: { ...state.camera, ...patch } })),

  setActiveStickerFill: (fill) => set({ activeStickerFill: fill }),
}));