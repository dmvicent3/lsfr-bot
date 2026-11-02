import type { Period } from "./types.ts";
import { DAY_MS, dateOfMs, dayMs } from "./periods.ts";
import { nextMidnight } from "./zoned.ts";

/** A player's latest finished daily game, as streaks need it. */
export interface LastGame {
  date: string;
  won: boolean;
  streak: number;
}

/** #1 on the first date, one more each day. */
export const puzzleNumber = (date: string, firstDate: string): number =>
  Math.round((dayMs(date) - dayMs(firstDate)) / DAY_MS) + 1;

export const previousDate = (date: string): string => dateOfMs(dayMs(date) - DAY_MS);

/** Time to the next puzzle, as "5h 12m" or "12m". */
export function untilNext(now: number, tz: string): string {
  const minutes = Math.floor((nextMidnight(now, tz) - now) / 60_000);
  const h = Math.floor(minutes / 60);

  return h > 0 ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}

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

/** 1-based rank, null when the player has no entry in the list. */
export function rankOf(list: readonly { userId: string }[], userId: string): number | null {
  const i = list.findIndex((s) => s.userId === userId);

  return i < 0 ? null : i + 1;
}

/** A player's rank in each period, as `rank` finds it. */
export function periodRanks(rank: (p: Period) => number | null): Record<Period, number | null> {
  return { today: rank("today"), week: rank("week"), month: rank("month"), all: rank("all") };
}
