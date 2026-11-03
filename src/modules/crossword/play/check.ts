import { PER_CHECK } from "../scoring.ts";
import { isCorrect, isFull } from "./cells.ts";
import type { PlayState, Verdict } from "./types.ts";

export const CHECK_LINE = "❌ Not quite — some letters are wrong";

/** The last line after a failed check; only a daily shows its cost. */
export const checkLine = (daily: boolean): string =>
  daily ? `${CHECK_LINE} (−${PER_CHECK})` : CHECK_LINE;

/** Judges the whole grid: only a full one is right or wrong. */
export function verdict(state: Pick<PlayState, "puzzle" | "cells">): Verdict {
  if (!isFull(state.cells)) return "incomplete";

  return isCorrect(state.puzzle, state.cells) ? "correct" : "wrong";
}
