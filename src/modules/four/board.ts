import { type Board, COLS, type Cell, type Disc, ROWS } from "./types.ts";

const CELLS: Record<string, Cell> = { ".": null, R: "R", Y: "Y" };

/** Across, down, down-right, down-left. */
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export const emptyBoard = (): Board => Array.from({ length: COLS * ROWS }, () => null);

export const toBoard = (text: string): Board => text.split("").map((c) => CELLS[c] ?? null);

export const fromBoard = (b: Board): string => b.map((c) => c ?? ".").join("");

export const other = (d: Disc): Disc => (d === "R" ? "Y" : "R");

/** The row a disc dropped in `col` lands on; null when the column is full. */
export function landingRow(b: Board, col: number): number | null {
  for (let row = ROWS - 1; row >= 0; row--) if (b[row * COLS + col] === null) return row;

  return null;
}

/** `d` dropped in `col`; the caller checks the column has room. */
export function drop(b: Board, col: number, d: Disc): Board {
  const row = landingRow(b, col) ?? 0;

  return b.map((cell, i) => (i === row * COLS + col ? d : cell));
}

export const legalColumns = (b: Board): number[] =>
  Array.from({ length: COLS }, (_, c) => c).filter((c) => landingRow(b, c) !== null);

/** The four cells from (row, col) along (dr, dc), or null when they leave the board. */
function line(row: number, col: number, [dr, dc]: readonly [number, number]): number[] | null {
  const end = [row + 3 * dr, col + 3 * dc] as const;

  if (end[0] >= ROWS || end[1] < 0 || end[1] >= COLS) return null;

  return [0, 1, 2, 3].map((k) => (row + k * dr) * COLS + col + k * dc);
}

/** Every 4-cell window on the board. */
export const WINDOWS: readonly number[][] = Array.from({ length: COLS * ROWS }, (_, i) =>
  DIRECTIONS.map((d) => line(Math.floor(i / COLS), i % COLS, d)),
)
  .flat()
  .filter((w): w is number[] => w !== null);

const isFour = (b: Board, w: number[]): boolean => {
  const first = b[w[0] ?? 0] ?? null;

  return first !== null && w.every((i) => b[i] === first);
};

/** The first four in a row found, its cells ascending; null when there is none. */
export function winLine(b: Board): number[] | null {
  const w = WINDOWS.find((win) => isFour(b, win));

  return w ? w.toSorted((x, y) => x - y) : null;
}

export function winnerOf(b: Board): Disc | null {
  const w = winLine(b);

  return w ? (b[w[0] ?? 0] ?? null) : null;
}

export const isFull = (b: Board): boolean => b.every((c) => c !== null);

/** Legal columns where dropping `d` makes four. */
export const winningColumns = (b: Board, d: Disc): number[] =>
  legalColumns(b).filter((c) => winnerOf(drop(b, c, d)) === d);

export const discCount = (b: Board, d: Disc): number => b.filter((c) => c === d).length;
