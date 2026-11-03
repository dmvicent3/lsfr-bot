import type { Game } from "../types.ts";
import { aimedCell, ownMarks, previewCells, targetMarks } from "./marks.ts";
import { CELL, gridSvg, text } from "./svg-grid.ts";
import type { Point, TextStyle } from "./types.ts";

const MARGIN = 12;
/** Room left of a grid for its row numbers, and above it for its column letters. */
const ROWS_GUTTER = 20;
const COLS_GUTTER = 18;
const TITLE_BAND = 24;
/** Between the top grid's bottom edge and the bottom grid's title. */
const GAP = 28;
const SIDE = 10 * CELL;

const TITLE: TextStyle = { size: 16, fill: "#111", bold: true };

/** Where each grid's top-left cell starts. */
export const PLACING_AT: Point = { x: MARGIN + ROWS_GUTTER, y: MARGIN + COLS_GUTTER };
export const TOP_AT: Point = { x: PLACING_AT.x, y: PLACING_AT.y + TITLE_BAND };
export const BOTTOM_AT: Point = {
  x: TOP_AT.x,
  y: TOP_AT.y + SIDE + GAP + TITLE_BAND + COLS_GUTTER,
};

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

/** A grid's title, centred above its column letters. */
const title = (at: Point, s: string): string =>
  text({ x: at.x + SIDE / 2, y: at.y - COLS_GUTTER - TITLE_BAND + TITLE.size }, TITLE, s);

/** Playing or over: jevos's waters on top (`reveal` shows its ships), the player's fleet below. */
export function battleSvg(g: Game, o: { reveal: boolean }): string {
  const target = { at: TOP_AT, mark: targetMarks(g, o.reveal), cursor: aimedCell(g, o.reveal) };

  return frame(TOP_AT.x + SIDE + MARGIN, BOTTOM_AT.y + SIDE + MARGIN, [
    title(TOP_AT, "jevos's waters"),
    title(BOTTOM_AT, "your fleet"),
    gridSvg({ ...target, preview: NONE }),
    gridSvg({ at: BOTTOM_AT, mark: ownMarks(g), preview: NONE, cursor: null }),
  ]);
}
