import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { EASY, EASY_SOLUTION } from "../fixtures.ts";

/** A game on the EASY puzzle; `cells` defaults to the givens. */
export function makeGame(over: Partial<Game> = {}): Game {
  return {
    guildId: "g",
    userId: "u",
    kind: "practice",
    date: "2026-11-03",
    slot: "1",
    level: "easy",
    givens: EASY,
    solution: EASY_SOLUTION,
    cells: EASY,
    wrong: "0".repeat(81),
    cursor: 2,
    checks: 0,
    startedAt: 0,
    solvedAt: null,
    points: null,
    streak: null,
    notes: "",
    noteMode: false,
    ...over,
  };
}

/** `s` with the character at `i` replaced. */
export function setAt(s: string, i: number, ch: string): string {
  return s.slice(0, i) + ch + s.slice(i + 1);
}

/** EASY solved except cell 40, which is the only empty cell (and not a given). */
export function almostSolved(): Game {
  const cells = setAt(EASY_SOLUTION, 40, "0");

  return makeGame({ givens: cells, cells, cursor: 40 });
}
