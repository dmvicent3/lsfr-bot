import type { Grid, Level } from "../types.ts";
import { makeBoard } from "./techniques/board.ts";
import { nakedPair } from "./techniques/pairs.ts";
import { pointing } from "./techniques/pointing.ts";
import { hiddenSingle, nakedSingle } from "./techniques/singles.ts";
import type { Board, Technique } from "./techniques/types.ts";

const SINGLES: Technique[] = [nakedSingle, hiddenSingle];
const MEDIUM: Technique[] = [...SINGLES, nakedPair, pointing];

const solved = (b: Board): boolean => b.cells.every((d) => d !== 0);

/** Applies the first technique that makes progress, then starts over; false when stuck. */
function step(b: Board, techniques: Technique[]): boolean {
  return techniques.some((t) => t(b));
}

function solveWith(b: Board, techniques: Technique[]): boolean {
  while (!solved(b) && step(b, techniques));

  return solved(b);
}

/** easy = singles only; medium = plus naked pairs and pointing; hard = anything else. */
export function grade(givens: Grid): Level {
  const b = makeBoard(givens);

  if (solveWith(b, SINGLES)) return "easy";

  return solveWith(b, MEDIUM) ? "medium" : "hard";
}
