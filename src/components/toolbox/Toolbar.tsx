import { TOOLS } from "../../constants/canvas";
import { useCanvasStore } from "../../store/canvasStore";

export function Toolbar() {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const elementCount = useCanvasStore((state) => state.elements.length);
  const active = TOOLS.find((tool) => tool.id === activeTool);

  return (
    <aside className="toolbar">
      <div className="toolbar-header">
        <span className="toolbar-logo">Canvas</span>
      </div>

      <div className="toolbar-tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`tool-btn${activeTool === tool.id ? " active" : ""}`}
            title={`${tool.label} — ${tool.hint}`}
            onClick={() => setActiveTool(tool.id)}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-footer">
        {active && <p className="tool-hint">{active.hint}</p>}
        <p className="tool-meta">
          {elementCount} element{elementCount === 1 ? "" : "s"}
        </p>
        <p className="tool-meta">Esc deselect &middot; Del remove</p>
      </div>
    </aside>
  );
}