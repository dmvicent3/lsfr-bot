import type { Award } from "./types.ts";

export const PER_CORRECT = 20;
export const PERFECT_BONUS = 20;
export const PER_STREAK_DAY = 5;
export const STREAK_BONUS_CAP = 50;
const QUESTIONS = 5;

/** `streak`: the streak after this game, so a first day (1) has no bonus. */
export function award(correct: number, streak: number): Award {
  const base = PER_CORRECT * correct;
  const perfect = correct === QUESTIONS ? PERFECT_BONUS : 0;
  const bonus = Math.min(PER_STREAK_DAY * (streak - 1), STREAK_BONUS_CAP);
  const parts = [`${correct} correct: ${base}`];

  if (perfect > 0) parts.push(`Perfect: +${perfect}`);

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: base + perfect + bonus, parts };
}
