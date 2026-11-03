import type { Puzzle, Slot } from "../types.ts";

export const EMPTY_CELL = ".";
export const BLOCK = "#";

/** A fresh board: `#` on blocks, `.` on white cells. */
export const emptyCells = (p: Puzzle): string => {
  const black = new Set(p.blocks);

  return Array.from({ length: p.size * p.size }, (_, i) =>
    black.has(i) ? BLOCK : EMPTY_CELL,
  ).join("");
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

/** A letter the player cannot overwrite: revealed letters are stored uppercase. */
export const isRevealed = (ch: string | undefined): boolean => !!ch && /^[A-Z]$/.test(ch);

/** Every white cell holds a letter. */
export const isFull = (cells: string): boolean => !cells.includes(EMPTY_CELL);

/** Indices of the white cells that are empty or differ from the solution (case-insensitive). */
export function wrongOrEmpty(p: Puzzle, cells: string): number[] {
  const sol = solutionOf(p);

  return cells.split("").flatMap((c, i) => (c !== BLOCK && c.toLowerCase() !== sol[i] ? [i] : []));
}

/** Every white cell equals the solution, case-insensitive. */
export const isCorrect = (p: Puzzle, cells: string): boolean => wrongOrEmpty(p, cells).length === 0;

/** Per slot: none of its cells is empty. */
export const filledSlots = (p: Puzzle, cells: string): boolean[] =>
  p.slots.map((slot) => slot.cells.every((i) => cells[i] !== EMPTY_CELL));

/** The slot's letters uppercased, `.` kept. */
export const slotText = (cells: string, slot: Slot): string =>
  slot.cells.map((i) => cells[i]!.toUpperCase()).join("");

/** `cells` with `letters` written at `at`. */
export function fill(cells: string, at: number[], letters: string): string {
  const out = cells.split("");

  at.forEach((cell, k) => {
    out[cell] = letters[k]!;
  });

  return out.join("");
}
