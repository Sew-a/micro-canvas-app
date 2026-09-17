import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type Konva from "konva";
import { TEXT_PLACEHOLDER } from "../../constants/canvas";
import { isTextBearingElement } from "../../lib/elements";
import {
  cancelTextEdit,
  commitTextEdit,
} from "../../lib/interactions/textEdit";
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
  const camera = useCanvasStore((state) => state.camera);
  const element = elements.find((candidate) => candidate.id === editingId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevIdRef = useRef<string | null>(null);
  const lastValueRef = useRef<string>("");
  const [value, setValue] = useState("");
  const [geometry, setGeometry] = useState<EditorGeometry>({
    left: 0,
    top: 0,
    width: 200,
    height: 40,
  });

  useEffect(() => {
    lastValueRef.current = value;
  });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !element || !isTextBearingElement(element)) return;

    if (prevIdRef.current && prevIdRef.current !== element.id) {
      commitTextEdit(prevIdRef.current, lastValueRef.current);
    }
    prevIdRef.current = element.id;

    setValue(element.text);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.value = element.text;
      textarea.focus();
      const end = element.text.length;
      if (element.type === "sticker") {
        textarea.setSelectionRange(0, end);
      } else {
        textarea.setSelectionRange(end, end);
      }
    }
  }, [editingId, element, stageRef]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !element || !isTextBearingElement(element)) return;

    const stageBox = stage.content.getBoundingClientRect();
    const node = stage.findOne("#" + element.id);

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
        left: stageBox.left + element.x * camera.scale + camera.x - element.padding,
        top: stageBox.top + element.y * camera.scale + camera.y - element.padding,
        width: 220,
        height: 44,
      });
    }
  }, [camera, element, stageRef]);

  if (!element || !isTextBearingElement(element)) return null;

  const handleCommit = () => commitTextEdit(element.id, value);

  return (
    <textarea
      ref={textareaRef}
      className="text-editor"
      placeholder={TEXT_PLACEHOLDER}
      style={{
        left: geometry.left,
        top: geometry.top,
        width: geometry.width,
        minHeight: geometry.height,
        textAlign: element.type === "sticker" ? "center" : "left",
      }}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          handleCommit();
        } else if (event.key === "Escape") {
          cancelTextEdit();
        }
      }}
      onBlur={handleCommit}
    />
  );
}