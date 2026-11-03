import type { Puzzle } from "../types.ts";

export const EMPTY_CELL = ".";

/** A fresh board: `#` on blocks, `.` on white cells. */
export const emptyCells = (p: Puzzle): string => {
  const black = new Set(p.blocks);

  return Array.from({ length: p.size * p.size }, (_, i) => (black.has(i) ? "#" : EMPTY_CELL)).join(
    "",
  );
};

/** The solution letter of every white cell (blocks stay `#`), as a board string. */
export function solutionOf(p: Puzzle): string {
  const out = emptyCells(p).split("");

  p.slots.forEach((slot, s) => {
    slot.cells.forEach((cell, k) => {
      out[cell] = p.answers[s]![k]!;
    });
  });

  return out.join("");
}

/** Per slot: every cell filled (cells only ever hold correct letters). */
export const solvedSlots = (p: Puzzle, cells: string): boolean[] =>
  p.slots.map((slot) => slot.cells.every((i) => cells[i] !== EMPTY_CELL));

/** Every white cell is filled. */
export const isFull = (cells: string): boolean => !cells.includes(EMPTY_CELL);

/** `cells` with `letters` written at `at`. */
export function fill(cells: string, at: number[], letters: string): string {
  const out = cells.split("");

  at.forEach((cell, k) => {
    out[cell] = letters[k]!;
  });

  return out.join("");
}
