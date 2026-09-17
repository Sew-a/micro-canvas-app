import type { ElementPosition, Camera } from "../../types/canvas";
import { VIEWPORT_MAX_SCALE, VIEWPORT_MIN_SCALE } from "../../constants/canvas";

export function clampScale(scale: number): number {
  return Math.max(VIEWPORT_MIN_SCALE, Math.min(VIEWPORT_MAX_SCALE, scale));
}

export function zoomAt(
  camera: Camera,
  factor: number,
  screenPoint: ElementPosition
): Camera {
  const scale = clampScale(camera.scale * factor);
  const worldX = (screenPoint.x - camera.x) / camera.scale;
  const worldY = (screenPoint.y - camera.y) / camera.scale;
  return {
    scale,
    x: screenPoint.x - worldX * scale,
    y: screenPoint.y - worldY * scale,
  };
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return { ...camera, x: camera.x + dx, y: camera.y + dy };
}

export function screenToWorld(
  screenPoint: ElementPosition,
  camera: Camera
): ElementPosition {
  return {
    x: (screenPoint.x - camera.x) / camera.scale,
    y: (screenPoint.y - camera.y) / camera.scale,
  };
}