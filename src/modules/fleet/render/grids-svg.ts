import type { Game } from "../types.ts";
import { aimedCell, ownMarks, previewCells, targetMarks } from "./marks.ts";
import { CELL, gridSvg, text } from "./svg-grid.ts";
import type { GridPaint, Point, TextStyle } from "./types.ts";

const MARGIN = 12;
/** Room left of a grid for its row numbers, and above it for its column letters. */
const ROWS_GUTTER = 20;
const COLS_GUTTER = 18;
const TITLE_BAND = 24;
const SIDE = 10 * CELL;

const TITLE: TextStyle = { size: 16, fill: "#111", bold: true };

/** Where each grid's top-left cell starts. */
export const PLACING_AT: Point = { x: MARGIN + ROWS_GUTTER, y: MARGIN + COLS_GUTTER };
export const TOP_AT: Point = { x: PLACING_AT.x, y: PLACING_AT.y + TITLE_BAND };

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

/** One titled grid filling the picture. */
const titled = (name: string, grid: Omit<GridPaint, "at">): string =>
  frame(TOP_AT.x + SIDE + MARGIN, TOP_AT.y + SIDE + MARGIN, [
    title(TOP_AT, name),
    gridSvg({ ...grid, at: TOP_AT }),
  ]);

/** Playing or over, the board's picture: jevos's waters (`reveal` shows its ships). */
export const watersSvg = (g: Game, o: { reveal: boolean }): string =>
  titled("jevos's waters", {
    mark: targetMarks(g, o.reveal),
    cursor: aimedCell(g, o.reveal),
    preview: NONE,
  });

/** Playing or over, the second message's picture: the player's fleet and jevos's shots. */
export const ownSvg = (g: Game): string =>
  titled("your fleet", { mark: ownMarks(g), preview: NONE, cursor: null });
