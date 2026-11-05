/** A box to draw, with the corner radius of its left and right ends. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  left: number;
  right: number;
}

/** An SVG path for a rectangle whose left and right corners can be rounded differently. */
export function roundedPath(b: Box): string {
  const { x, y, w, h, left: l, right: r } = b;

  return [
    `M${x + l},${y}`,
    `H${x + w - r}`,
    `A${r},${r} 0 0 1 ${x + w},${y + r}`,
    `V${y + h - r}`,
    `A${r},${r} 0 0 1 ${x + w - r},${y + h}`,
    `H${x + l}`,
    `A${l},${l} 0 0 1 ${x},${y + h - l}`,
    `V${y + l}`,
    `A${l},${l} 0 0 1 ${x + l},${y}`,
    "Z",
  ].join(" ");
}
