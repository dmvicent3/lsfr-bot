/** A spot on the board image, in pixels. */
export interface Point {
  x: number;
  y: number;
}

/** How one `<text>` is drawn. */
export interface TextStyle {
  size: number;
  fill: string;
  bold?: boolean;
}
