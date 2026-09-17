import { useEffect } from "react";
import {
  handleCanvasKeyDown,
  handleCanvasKeyUp,
} from "../lib/interactions/canvas";

export function useCanvasKeyboard(): void {
  useEffect(() => {
    window.addEventListener("keydown", handleCanvasKeyDown);
    window.addEventListener("keyup", handleCanvasKeyUp);
    return () => {
      window.removeEventListener("keydown", handleCanvasKeyDown);
      window.removeEventListener("keyup", handleCanvasKeyUp);
    };
  }, []);
}