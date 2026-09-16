import { Line, Rect } from "react-konva";
import { CANVAS_BACKGROUND, GRID_COLOR, GRID_SIZE } from "../../constants/canvas";

interface GridBackgroundProps {
  width: number;
  height: number;
}

export function GridBackground({ width, height }: GridBackgroundProps) {
  const verticals: number[] = [];
  const horizontals: number[] = [];

  for (let x = 0; x <= width; x += GRID_SIZE) verticals.push(x);
  for (let y = 0; y <= height; y += GRID_SIZE) horizontals.push(y);

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={CANVAS_BACKGROUND}
        listening={false}
      />
      {verticals.map((x) => (
        <Line
          key={`v-${x}`}
          points={[x, 0, x, height]}
          stroke={GRID_COLOR}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {horizontals.map((y) => (
        <Line
          key={`h-${y}`}
          points={[0, y, width, y]}
          stroke={GRID_COLOR}
          strokeWidth={1}
          listening={false}
        />
      ))}
    </>
  );
}