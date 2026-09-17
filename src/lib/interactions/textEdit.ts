import { isTextBearingElement } from "../../lib/elements";
import { useCanvasStore } from "../../store/canvasStore";

export function commitTextEdit(id: string, draft: string): void {
  const store = useCanvasStore.getState();
  const element = store.elements.find((candidate) => candidate.id === id);
  if (!element || !isTextBearingElement(element)) return;

  const text = draft.trim();
  if (!text && element.text === "") {
    store.removeElement(id);
  } else {
    store.updateElement(id, { text: text.length > 0 ? text : element.text });
  }

  if (store.editingId === id) store.setEditing(null);
}

export function cancelTextEdit(): void {
  useCanvasStore.getState().setEditing(null);
}