let panKeyDown = false;

export function setPanKeyDown(down: boolean): void {
  panKeyDown = down;
}

export function isPanKeyDown(): boolean {
  return panKeyDown;
}

export function resetPanKey(): void {
  panKeyDown = false;
}