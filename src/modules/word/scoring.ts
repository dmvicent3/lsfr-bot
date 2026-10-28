import type { Award } from "./types.ts";

export const MAX_ATTEMPTS = 6;
export const WIN = 100;
export const PER_UNUSED_ATTEMPT = 10;
export const PER_STREAK_DAY = 5;
export const STREAK_BONUS_CAP = 50;
export const FINISHED_LOSS = 5;

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** `streak`: the streak after this game, so a first win (1) has no bonus. */
export function award(won: boolean, attempts: number, streak: number): Award {
  if (!won) return { points: FINISHED_LOSS, parts: [`${FINISHED_LOSS} for finishing`] };

  const unused = MAX_ATTEMPTS - attempts;
  const bonus = Math.min(PER_STREAK_DAY * (streak - 1), STREAK_BONUS_CAP);
  const parts = [`${WIN} solved`];

  if (unused > 0) {
    parts.push(`${PER_UNUSED_ATTEMPT * unused} for ${plural(unused, "unused attempt")}`);
  }

  if (bonus > 0) parts.push(`${bonus} streak bonus`);

  return { points: WIN + PER_UNUSED_ATTEMPT * unused + bonus, parts };
}
