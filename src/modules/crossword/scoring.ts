import { streakBonus } from "../../core/daily.ts";
import type { Award } from "./types.ts";

export const MAX_POINTS = 100;
export const PER_MISTAKE = 5;
export const PER_REVEAL = 10;

/** 100 minus the penalties, never below 0. */
export const basePoints = (wrong: number, reveals: number): number =>
  Math.max(0, MAX_POINTS - PER_MISTAKE * wrong - PER_REVEAL * reveals);

/** `streak`: the streak after this game. Giving up scores nothing and earns no bonus. */
export function award(solved: boolean, wrong: number, reveals: number, streak: number): Award {
  if (!solved) return { points: 0, parts: [] };

  const bonus = streakBonus(streak);
  const parts = [`Solved: ${MAX_POINTS}`];

  if (wrong > 0) parts.push(`Mistakes: −${PER_MISTAKE * wrong}`);

  if (reveals > 0) parts.push(`Reveals: −${PER_REVEAL * reveals}`);

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: basePoints(wrong, reveals) + bonus, parts };
}
