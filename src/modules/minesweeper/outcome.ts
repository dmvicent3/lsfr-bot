import type { CellState } from "./types.ts";

/** Won once every safe cell is open. */
export const isWon = (field: boolean[], cells: CellState[]): boolean =>
  cells.every((c, i) => field[i] || c === "open");

/** Whole seconds played; 0 before the first reveal. */
export const elapsedSeconds = (startedAt: number | null, at: number): number =>
  startedAt === null ? 0 : Math.floor((at - startedAt) / 1000);
