import { previousDate } from "./puzzle-date.ts";
import type { LastGame } from "./types.ts";

/** A win extends a win from the day before; anything else starts over. A loss is 0. */
export function nextStreak(last: LastGame | null, date: string, won: boolean): number {
  if (!won) return 0;

  return last?.won && last.date === previousDate(date) ? last.streak + 1 : 1;
}

/** Alive while the latest game was today or yesterday. */
export function currentStreak(last: LastGame | null, today: string): number {
  if (!last) return 0;

  return last.date === today || last.date === previousDate(today) ? last.streak : 0;
}
