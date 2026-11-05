import { clue } from "../clue/clue.ts";
import { barsOf } from "./bars.ts";
import type { Line } from "./types.ts";

/** How many of the latest guesses the picture shows. */
export const SHOWN = 12;

/** The latest guesses as picture rows, numbered from the first guess, and how many are left out. */
export function boardLines(guesses: string[], answer: string): { lines: Line[]; earlier: number } {
  const earlier = Math.max(0, guesses.length - SHOWN);
  const lines = guesses.slice(earlier).map((g, k) => ({
    n: earlier + k + 1,
    letters: g,
    bars: barsOf(clue(g, answer)),
  }));

  return { lines, earlier };
}
