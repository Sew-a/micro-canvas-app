import type Konva from "konva";
import type { CanvasElement } from "../../types/canvas";

function triggerDownload(href: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function exportStageToPng(
  stage: Konva.Stage | null,
  fileName = "canvas.png"
): void {
  if (!stage) return;
  const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
  triggerDownload(dataUrl, fileName);
}

export function exportBoardToJson(
  elements: CanvasElement[],
  fileName = "canvas.json"
): void {
  const blob = new Blob([JSON.stringify(elements, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName);
  URL.revokeObjectURL(url);
}