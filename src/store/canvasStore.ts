import { create } from "zustand";
import type { CanvasElement, ToolId } from "../types/canvas";

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  editingId: string | null;
  activeTool: ToolId;
  setActiveTool: (tool: ToolId) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  select: (id: string | null) => void;
  setEditing: (id: string | null) => void;
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  elements: [],
  selectedId: null,
  editingId: null,
  activeTool: "select",

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
}));