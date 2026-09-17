import { useEffect, useState, type RefObject } from "react";

interface Size {
  width: number;
  height: number;
}

export function useCanvasSize(
  containerRef: RefObject<HTMLDivElement | null>
): Size {
  const [size, setSize] = useState<Size>({ width: 900, height: 600 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () =>
      setSize({ width: container.clientWidth, height: container.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}