export type Disc = "R" | "Y";

export type Cell = Disc | null;

/** 42 cells, index `row * 7 + col`, row 0 at the top. */
export type Board = readonly Cell[];

export type Difficulty = "easy" | "normal" | "hard";

export const COLS = 7;

export const ROWS = 6;
