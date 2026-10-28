import { nextMidnight } from "../../core/zoned.ts";

export const FIRST_PUZZLE = "2026-10-28";

export const DAY_MS = 86_400_000;

/** A YYYY-MM-DD date as UTC midnight. */
export const dayMs = (date: string): number => Date.parse(`${date}T00:00:00Z`);

export const dateOfMs = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

/** #1 on launch day, one more each day. */
export const puzzleNumber = (date: string): number =>
  Math.round((dayMs(date) - dayMs(FIRST_PUZZLE)) / DAY_MS) + 1;

export const previousDate = (date: string): string => dateOfMs(dayMs(date) - DAY_MS);

/** Time to the next puzzle, as "5h 12m" or "12m". */
export function untilNext(now: number, tz: string): string {
  const minutes = Math.floor((nextMidnight(now, tz) - now) / 60_000);
  const h = Math.floor(minutes / 60);

  return h > 0 ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}
