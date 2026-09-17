import { COLOR_PALETTE } from "../../constants/canvas";
import {
  applyColorToElement,
  getColorTarget,
  getElementColor,
} from "../../lib/interactions/colorize";
import { useCanvasStore } from "../../store/canvasStore";

export function ColorPanel() {
  const selectedId = useCanvasStore((state) => state.selectedId);
  const element = useCanvasStore((state) =>
    state.elements.find((candidate) => candidate.id === state.selectedId)
  );

  if (!selectedId || !element) return null;

  const target = getColorTarget(element);
  const current = getElementColor(element);

  return (
    <div className="color-panel" role="group" aria-label="Element color">
      <span className="color-panel-title">
        {target === "stroke" ? "Border / line color" : "Fill / text color"}
      </span>
      <div className="color-swatches">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch${
              color.toLowerCase() === current.toLowerCase() ? " active" : ""
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Set color ${color}`}
            title={color}
            onClick={() => applyColorToElement(selectedId, color)}
          />
        ))}
      </div>
    </div>
  );
}