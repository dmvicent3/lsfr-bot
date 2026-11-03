import type { Game } from "../types.ts";
import { aimedCell, ownMarks, previewCells, targetMarks } from "./marks.ts";
import { CELL, gridSvg, text } from "./svg-grid.ts";
import type { Point, TextStyle } from "./types.ts";

const MARGIN = 12;
/** Room left of a grid for its row numbers, and above it for its column letters. */
const ROWS_GUTTER = 20;
const COLS_GUTTER = 18;
const TITLE_BAND = 24;
const GAP = 40;
const SIDE = 10 * CELL;

const TITLE: TextStyle = { size: 16, fill: "#111", bold: true };

/** Where each grid's top-left cell starts. */
export const PLACING_AT: Point = { x: MARGIN + ROWS_GUTTER, y: MARGIN + COLS_GUTTER };
export const LEFT_AT: Point = { x: PLACING_AT.x, y: PLACING_AT.y + TITLE_BAND };
export const RIGHT_AT: Point = { x: LEFT_AT.x + SIDE + GAP, y: LEFT_AT.y };

const NONE = new Set<number>();

function frame(width: number, height: number, body: string[]): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="DejaVu Sans">`,
    `<rect width="${width}" height="${height}" fill="#fff"/>`,
    ...body,
    "</svg>",
  ].join("");
}

/** Placing: the player's grid alone, with the next ship previewed from the cursor. */
export function fleetSvg(g: Game, o: { preview: boolean }): string {
  const preview = o.preview ? previewCells(g) : NONE;
  const grid = gridSvg({ at: PLACING_AT, mark: ownMarks(g), preview, cursor: null });

  return frame(PLACING_AT.x + SIDE + MARGIN, PLACING_AT.y + SIDE + MARGIN, [grid]);
}

/** Playing or over: jevos's waters left (`reveal` shows its ships), the player's fleet right. */
export function battleSvg(g: Game, o: { reveal: boolean }): string {
  const titleY = MARGIN + TITLE.size;
  const target = { at: LEFT_AT, mark: targetMarks(g, o.reveal), cursor: aimedCell(g, o.reveal) };

  return frame(RIGHT_AT.x + SIDE + MARGIN, LEFT_AT.y + SIDE + MARGIN, [
    text({ x: LEFT_AT.x + SIDE / 2, y: titleY }, TITLE, "jevos's waters"),
    text({ x: RIGHT_AT.x + SIDE / 2, y: titleY }, TITLE, "your fleet"),
    gridSvg({ ...target, preview: NONE }),
    gridSvg({ at: RIGHT_AT, mark: ownMarks(g), preview: NONE, cursor: null }),
  ]);
}
