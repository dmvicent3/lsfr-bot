import type { Award, Level } from "./types.ts";

export const BASE: Record<Level, number> = { easy: 50, medium: 100, hard: 150 };
export const PER_CHECK = 10;
export const PER_STREAK_DAY = 5;
export const STREAK_BONUS_CAP = 50;

const label = (level: Level): string => level[0]!.toUpperCase() + level.slice(1);

/** `streak`: the streak after this game, so a first day (1) has no bonus. */
export function award(level: Level, checks: number, streak: number): Award {
  const base = BASE[level];
  const penalty = Math.min(PER_CHECK * checks, base / 2);
  const bonus = Math.min(PER_STREAK_DAY * (streak - 1), STREAK_BONUS_CAP);
  const parts = [`${label(level)}: ${base}`];

  if (penalty > 0) parts.push(`${checks} check${checks === 1 ? "" : "s"}: −${penalty}`);

  if (bonus > 0) parts.push(`Streak ${streak}: +${bonus}`);

  return { points: base - penalty + bonus, parts };
}
