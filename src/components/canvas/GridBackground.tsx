import { Line, Rect } from "react-konva";
import {
  CANVAS_BACKGROUND,
  GRID_COLOR,
  GRID_SIZE,
  MIN_GRID_SPACING,
} from "../../constants/canvas";
import type { Camera } from "../../types/canvas";

interface GridBackgroundProps {
  width: number;
  height: number;
  camera: Camera;
}

function gridSpacing(scale: number): number {
  let step = GRID_SIZE;
  while (step * scale < MIN_GRID_SPACING) step *= 2;
  return step;
}

export function GridBackground({
  width,
  height,
  camera,
}: GridBackgroundProps) {
  const { x, y, scale } = camera;
  const spacing = gridSpacing(scale);

  const worldLeft = -x / scale;
  const worldTop = -y / scale;
  const worldWidth = width / scale;
  const worldHeight = height / scale;

  const verticals: number[] = [];
  const horizontals: number[] = [];

  for (let gx = Math.floor(worldLeft / spacing) * spacing; gx <= worldLeft + worldWidth; gx += spacing) {
    verticals.push(gx);
  }
  for (let gy = Math.floor(worldTop / spacing) * spacing; gy <= worldTop + worldHeight; gy += spacing) {
    horizontals.push(gy);
  }

  return (
    <>
      <Rect
        x={worldLeft}
        y={worldTop}
        width={worldWidth}
        height={worldHeight}
        fill={CANVAS_BACKGROUND}
        listening={false}
      />
      {verticals.map((gx) => (
        <Line
          key={`v-${gx}`}
          points={[gx, worldTop, gx, worldTop + worldHeight]}
          stroke={GRID_COLOR}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {horizontals.map((gy) => (
        <Line
          key={`h-${gy}`}
          points={[worldLeft, gy, worldLeft + worldWidth, gy]}
          stroke={GRID_COLOR}
          strokeWidth={1}
          listening={false}
        />
      ))}
    </>
  );
}