import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Group, Rect, Text } from "react-konva";
import { ACCENT_BLUE } from "../../constants/canvas";
import { isSquareElement, isTextElement } from "../../lib/elements";
import { useCanvasStore } from "../../store/canvasStore";
import type { CanvasElement, TextElement } from "../../types/canvas";

interface ElementNodeProps {
  element: CanvasElement;
}

export function ElementNode({ element }: ElementNodeProps) {
  const isSelected = useCanvasStore((state) => state.selectedId === element.id);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const select = useCanvasStore((state) => state.select);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const setEditing = useCanvasStore((state) => state.setEditing);

  const interactive = activeTool === "select";
  const draggable = interactive;
  const listening = interactive;

  const handlePointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>
  ) => {
    event.cancelBubble = true;
    select(element.id);
  };

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    updateElement(element.id, { x: event.target.x(), y: event.target.y() });
  };

  if (isSquareElement(element)) {
    return (
      <Group
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable={draggable}
        listening={listening}
        onMouseDown={handlePointerDown}
        onTap={handlePointerDown}
        onDragEnd={handleDragEnd}
      >
        <Rect
          width={element.width}
          height={element.height}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={element.strokeWidth}
          cornerRadius={element.cornerRadius}
          shadowColor="#0b0e14"
          shadowBlur={isSelected ? 8 : 0}
          shadowOpacity={isSelected ? 0.12 : 0}
        />
      </Group>
    );
  }

  if (isTextElement(element)) {
    return <TextNode element={element} isSelected={isSelected} draggable={draggable} listening={listening} onPointerDown={handlePointerDown} onDragEnd={handleDragEnd} onEdit={(id) => setEditing(id)} />;
  }

  return null;
}

interface TextNodeProps {
  element: TextElement;
  isSelected: boolean;
  draggable: boolean;
  listening: boolean;
  onPointerDown: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => void;
  onEdit: (id: string) => void;
}

function TextNode({
  element,
  isSelected,
  draggable,
  listening,
  onPointerDown,
  onDragEnd,
  onEdit,
}: TextNodeProps) {
  const textRef = useRef<Konva.Text>(null);
  const [box, setBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const node = textRef.current;
    if (!node) return;
    const rect = node.getClientRect({
      skipTransform: true,
      skipShadow: true,
      skipStroke: true,
    });
    setBox({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
  }, [element.text, element.fontSize, element.fontFamily, element.padding]);

  const handleDblClick = (event: Konva.KonvaEventObject<MouseEvent>) => {
    event.cancelBubble = true;
    onEdit(element.id);
  };

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={draggable}
      listening={listening}
      onMouseDown={onPointerDown}
      onTap={onPointerDown}
      onDblClick={handleDblClick}
      onDragEnd={onDragEnd}
    >
      <Text
        ref={textRef}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fill={element.fill}
        padding={element.padding}
      />
      {isSelected && (
        <Rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          fill="#4262ff"
          opacity={0.05}
          stroke={ACCENT_BLUE}
          strokeWidth={1.5}
          dash={[6, 4]}
        />
      )}
    </Group>
  );
}