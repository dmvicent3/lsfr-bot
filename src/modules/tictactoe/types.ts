export type Mark = "X" | "O";

export type Cell = Mark | null;

/** Squares 0–8, left to right, top to bottom. */
export type Board = readonly Cell[];

/** jevos's move; `share` is its part of all the yeses, null when jevos blanked and guessed. */
export interface JevosPick {
  square: number;
  share: number | null;
}
