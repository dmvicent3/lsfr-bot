import type { Puzzle } from "../types.ts";

/** The indices of the slots through a cell, across first (the order of `puzzle.slots`). */
export const slotsThrough = (p: Puzzle, cell: number): number[] =>
  p.slots.flatMap((s, i) => (s.cells.includes(cell) ? [i] : []));
