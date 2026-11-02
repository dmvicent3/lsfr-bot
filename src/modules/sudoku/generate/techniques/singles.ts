import { UNITS } from "../grid.ts";
import { bitOf, digitOf, place, popcount } from "./board.ts";
import type { Board, Technique } from "./types.ts";

/** A cell with exactly one candidate left. */
export const nakedSingle: Technique = (b: Board) => {
  const cell = b.marks.findIndex((m, c) => b.cells[c] === 0 && popcount(m) === 1);

  if (cell < 0) return false;

  place(b, cell, digitOf(b.marks[cell]!));

  return true;
};

/** A digit with exactly one possible cell in a row, column or box. */
export const hiddenSingle: Technique = (b: Board) => {
  for (const unit of UNITS) {
    for (let d = 1; d <= 9; d++) {
      const spots = unit.filter((c) => (b.marks[c]! & bitOf(d)) !== 0);

      if (spots.length !== 1) continue;

      place(b, spots[0]!, d);

      return true;
    }
  }

  return false;
};
