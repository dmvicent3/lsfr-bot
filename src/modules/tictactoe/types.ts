export type Mark = "X" | "O";

export type Cell = Mark | null;

/** Squares 0–8, left to right, top to bottom. */
export type Board = readonly Cell[];
