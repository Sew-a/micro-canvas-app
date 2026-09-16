import "./App.css";
import { CanvasStage } from "./components/canvas/CanvasStage";
import { Toolbar } from "./components/toolbox/Toolbar";

function App() {
  return (
    <div className="app-shell">
      <Toolbar />
      <main className="canvas-area">
        <CanvasStage />
      </main>
    </div>
  );
}

export default App;