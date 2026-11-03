import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";
import { emptyCells } from "../../../../src/modules/crossword/play/cells.ts";
import type { PlayState } from "../../../../src/modules/crossword/play/types.ts";
import type { Puzzle, StoredPuzzle } from "../../../../src/modules/crossword/types.ts";

const ROWS = ["crane", "olive", "unite", "ponds", "stems"];

/** An open 5×5 square: rows are the across answers, columns the down ones (not real words). */
export const square = (): Puzzle => {
  const slots = slotsOf(5, []);
  const answers = slots.map((s) =>
    s.dir === "a" ? ROWS[Math.floor(s.cells[0]! / 5)]! : ROWS.map((r) => r[s.cells[0]!]!).join(""),
  );

  return { size: 5, blocks: [], slots, answers };
};

export const storedSquare = (): StoredPuzzle => ({
  puzzle: square(),
  clues: square().slots.map((s) => `clue ${s.n}${s.dir}`),
});

export const indexOf = (n: number, dir: "a" | "d"): number =>
  square().slots.findIndex((s) => s.n === n && s.dir === dir);

/** Slot index of an across row / down column of the square. */
export const row = (r: number): number => indexOf(r === 0 ? 1 : r + 5, "a");
export const col = (c: number): number => indexOf(c + 1, "d");

export const word = (slot: number): string => square().answers[slot]!;

export const state = (over: Partial<PlayState> = {}): PlayState => ({
  puzzle: square(),
  cells: emptyCells(square()),
  wrong: 0,
  reveals: 0,
  finished: false,
  ...over,
});
