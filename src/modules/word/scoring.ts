import { streakBonus } from "../../core/daily.ts";
import type { Award } from "./types.ts";

export const MAX_ATTEMPTS = 6;
export const WIN = 100;
export const PER_UNUSED_ATTEMPT = 10;
export const FINISHED_LOSS = 5;

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What a win adds on top of its base: unused attempts and the streak bonus, with their lines. */
export function winBonus(unused: number, streak: number): Award {
  const bonus = streakBonus(streak);
  const parts: string[] = [];

  if (unused > 0) {
    parts.push(`${PER_UNUSED_ATTEMPT * unused} for ${plural(unused, "unused attempt")}`);
  }

  if (bonus > 0) parts.push(`${bonus} streak bonus`);

  return { points: PER_UNUSED_ATTEMPT * unused + bonus, parts };
}

/** `streak`: the streak after this game, so a first win (1) has no bonus. */
export function award(won: boolean, attempts: number, streak: number): Award {
  if (!won) return { points: FINISHED_LOSS, parts: [`${FINISHED_LOSS} for finishing`] };

  const extra = winBonus(MAX_ATTEMPTS - attempts, streak);

  return { points: WIN + extra.points, parts: [`${WIN} solved`, ...extra.parts] };
}
