import { streakBonus } from "../../core/daily.ts";
import type { Award } from "./types.ts";

export const MAX_POINTS = 100;
export const PER_GUESS = 10;
export const MIN_POINTS = 10;

const plural = (n: number, word: string, many: string): string => `${n} ${n === 1 ? word : many}`;

/** 100 for a solve on the first guess, 10 less per guess after it, never under 10. */
export const basePoints = (guesses: number): number =>
  Math.max(MIN_POINTS, MAX_POINTS - PER_GUESS * (guesses - 1));

/** `streak`: the streak after this game. A give-up scores nothing. */
export function award(solved: boolean, guesses: number, streak: number): Award {
  if (!solved) return { points: 0, parts: [] };

  const base = basePoints(guesses);
  const bonus = streakBonus(streak);
  const parts = [`Solved in ${plural(guesses, "guess", "guesses")}: ${base}`];

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: base + bonus, parts };
}
