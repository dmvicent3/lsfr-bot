import { PATTERNS } from "../../../../src/modules/crossword/generate/patterns.ts";
import { slotsOf } from "../../../../src/modules/crossword/generate/slots.ts";
import { emptyCells } from "../../../../src/modules/crossword/play/cells.ts";
import type { BoardView } from "../../../../src/modules/crossword/render/types.ts";
import type { StoredPuzzle } from "../../../../src/modules/crossword/types.ts";
import { storedSquare } from "../play/fixtures.ts";

/** The open 5×5 square: slots 1–5 down, 1 and 6–9 across; answers crane/olive/unite/ponds/stems. */
export const SQUARE = storedSquare();

export const V: BoardView = {
  scope: "2026-11-05",
  stamp: "mh1x",
  number: 3,
  stored: SQUARE,
  cells: `crane${".".repeat(20)}`,
  wrong: 1,
  reveals: 0,
  lastLine: null,
  points: 95,
  finished: false,
  solved: false,
  elapsedMs: 134_000,
  award: null,
  menu: null,
};

/** The densest 7×7 pattern with every clue 90 characters long. */
export function bigStored(): StoredPuzzle {
  const blocks = PATTERNS[7].toSorted((a, b) => slotsOf(7, b).length - slotsOf(7, a).length)[0]!;
  const slots = slotsOf(7, blocks);

  return {
    puzzle: {
      size: 7,
      blocks,
      slots,
      answers: slots.map((s) => "w".repeat(s.cells.length)),
    },
    clues: slots.map((s) => `${s.n}${s.dir}`.padEnd(90, "x")),
  };
}

export const bigView = (over: Partial<BoardView> = {}): BoardView => {
  const stored = bigStored();

  return { ...V, stored, cells: emptyCells(stored.puzzle), ...over };
};

const letterAt = (i: number) => String.fromCharCode(97 + (i % 26));

/** The most clues a 15×15 pattern has in one direction. */
const most = (b: number[]) =>
  Math.max(...(["a", "d"] as const).map((d) => slotsOf(15, b).filter((s) => s.dir === d).length));

/**
 * The 15×15 pattern with the most clues in one direction, every clue 90 characters long:
 * the longest clue list a board can show; cell i holds `a` + i mod 26.
 */
export function big15Stored(): StoredPuzzle {
  const blocks = PATTERNS[15].toSorted((a, b) => most(b) - most(a))[0]!;
  const slots = slotsOf(15, blocks);

  return {
    puzzle: {
      size: 15,
      blocks,
      slots,
      answers: slots.map((s) => s.cells.map(letterAt).join("")),
    },
    clues: slots.map((s) => `${s.n}${s.dir}`.padEnd(90, "x")),
  };
}

export const big15View = (over: Partial<BoardView> = {}): BoardView => {
  const stored = big15Stored();

  return {
    ...V,
    scope: "practice",
    number: null,
    stored,
    cells: emptyCells(stored.puzzle),
    menu: { dir: "a", page: 0 },
    ...over,
  };
};
