import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Group, Line, Rect, Text } from "react-konva";
import { ACCENT_BLUE } from "../../constants/canvas";
import {
  flattenPoints,
  isDrawElement,
  isSquareElement,
  isStickerElement,
  isTextElement,
} from "../../lib/elements";
import {
  handleElementDragEnd,
  handleElementEdit,
  handleElementSelect,
} from "../../lib/interactions/elements";
import { useCanvasStore } from "../../store/canvasStore";
import type {
  CanvasElement,
  DrawElement,
  StickerElement,
  TextElement,
} from "../../types/canvas";

interface ElementNodeProps {
  element: CanvasElement;
}

export function ElementNode({ element }: ElementNodeProps) {
  const isSelected = useCanvasStore((state) => state.selectedId === element.id);
  const interactive = useCanvasStore((state) => state.activeTool === "select");

  if (isSquareElement(element)) {
    return (
      <Group
        id={element.id}
        x={element.x}
        y={element.y}
        rotation={element.rotation}
        draggable={interactive}
        listening={interactive}
        onMouseDown={(event) => handleElementSelect(event, element.id)}
        onTap={(event) => handleElementSelect(event, element.id)}
        onDragEnd={(event) => handleElementDragEnd(event, element.id)}
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

  if (isDrawElement(element)) {
    return (
      <DrawNode
        element={element}
        interactive={interactive}
      />
    );
  }

  if (isTextElement(element)) {
    return (
      <TextNode
        element={element}
        interactive={interactive}
        isSelected={isSelected}
      />
    );
  }

  if (isStickerElement(element)) {
    return (
      <StickerNode
        element={element}
        interactive={interactive}
        isSelected={isSelected}
      />
    );
  }

  return null;
}

function groupHandlers(id: string) {
  return {
    onMouseDown: (event: Konva.KonvaEventObject<Event>) =>
      handleElementSelect(event, id),
    onTap: (event: Konva.KonvaEventObject<Event>) =>
      handleElementSelect(event, id),
    onDragEnd: (event: Konva.KonvaEventObject<Event>) =>
      handleElementDragEnd(event, id),
  };
}

function editableGroupHandlers(id: string) {
  return {
    ...groupHandlers(id),
    onDblClick: () => handleElementEdit(id),
  };
}

interface DrawNodeProps {
  element: DrawElement;
  interactive: boolean;
}

function DrawNode({ element, interactive }: DrawNodeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={interactive}
      listening={interactive}
      {...groupHandlers(element.id)}
    >
      <Line
        points={flattenPoints(element.points)}
        stroke={element.stroke}
        strokeWidth={element.strokeWidth}
        tension={element.tension}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}

interface TextNodeProps {
  element: TextElement;
  interactive: boolean;
  isSelected: boolean;
}

function TextNode({ element, interactive, isSelected }: TextNodeProps) {
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

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={interactive}
      listening={interactive}
      {...editableGroupHandlers(element.id)}
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

interface StickerNodeProps {
  element: StickerElement;
  interactive: boolean;
  isSelected: boolean;
}

function StickerNode({ element, interactive, isSelected }: StickerNodeProps) {
  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={interactive}
      listening={interactive}
      {...editableGroupHandlers(element.id)}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={element.fill}
        cornerRadius={6}
        shadowColor="#0b0e14"
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={isSelected ? 0.15 : 0}
      />
      <Text
        x={element.padding}
        y={element.padding}
        width={element.width - element.padding * 2}
        height={element.height - element.padding * 2}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fill={element.textFill}
        align="center"
        verticalAlign="middle"
        wrap="word"
      />
      {isSelected && (
        <Rect
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          fill="#4262ff"
          opacity={0.06}
          stroke={ACCENT_BLUE}
          strokeWidth={1.5}
          dash={[6, 4]}
        />
      )}
    </Group>
  );
}