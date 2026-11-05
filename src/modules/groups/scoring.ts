import { streakBonus } from "../../core/daily.ts";
import type { Award } from "./types.ts";

export const MAX_POINTS = 100;
export const PER_MISTAKE = 15;

/** 100 minus 15 per mistake. */
export const basePoints = (mistakes: number): number =>
  Math.max(0, MAX_POINTS - PER_MISTAKE * mistakes);

/** `streak`: the streak after this game. A loss or give-up scores nothing. */
export function award(solved: boolean, mistakes: number, streak: number): Award {
  if (!solved) return { points: 0, parts: [] };

  const bonus = streakBonus(streak);
  const parts = [`Solved: ${MAX_POINTS}`];

  if (mistakes > 0) parts.push(`Mistakes: −${PER_MISTAKE * mistakes}`);

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: basePoints(mistakes) + bonus, parts };
}
