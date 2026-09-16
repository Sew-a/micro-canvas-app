import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type Konva from "konva";
import { isTextElement } from "../../lib/elements";
import { useCanvasStore } from "../../store/canvasStore";

interface TextEditorProps {
  stageRef: RefObject<Konva.Stage | null>;
}

interface EditorGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function TextEditor({ stageRef }: TextEditorProps) {
  const editingId = useCanvasStore((state) => state.editingId);
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const setEditing = useCanvasStore((state) => state.setEditing);

  const element = elements.find((element) => element.id === editingId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [geometry, setGeometry] = useState<EditorGeometry>({
    left: 0,
    top: 0,
    width: 200,
    height: 40,
  });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !element || !isTextElement(element)) return;

    setValue(element.text);

    const node = stage.findOne("#" + element.id);
    const stageBox = stage.content.getBoundingClientRect();

    if (node) {
      const rect = node.getClientRect({
        skipTransform: true,
        skipShadow: true,
        skipStroke: true,
      });
      const position = node.getAbsolutePosition();
      setGeometry({
        left: stageBox.left + position.x - element.padding,
        top: stageBox.top + position.y - element.padding,
        width: Math.max(180, rect.width),
        height: Math.max(40, rect.height),
      });
    } else {
      setGeometry({
        left: stageBox.left + element.x,
        top: stageBox.top + element.y,
        width: 220,
        height: 44,
      });
    }

    const frame = requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [editingId, stageRef, element]);

  if (!element || !isTextElement(element)) return null;

  const commit = () => {
    const next = value.trim();
    updateElement(element.id, { text: next.length > 0 ? next : element.text });
    setEditing(null);
  };

  return (
    <textarea
      ref={textareaRef}
      className="text-editor"
      style={{
        left: geometry.left,
        top: geometry.top,
        width: geometry.width,
        minHeight: geometry.height,
      }}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          commit();
        } else if (event.key === "Escape") {
          setEditing(null);
        }
      }}
      onBlur={commit}
    />
  );
}