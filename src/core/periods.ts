import type { DateRange } from "./types.ts";
import { wallToInstant } from "./zoned.ts";

export const DAY_MS = 86_400_000;

/** A YYYY-MM-DD date as UTC midnight. */
export const dayMs = (date: string): number => Date.parse(`${date}T00:00:00Z`);

export const dateOfMs = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const short = (date: string): string =>
  new Date(dayMs(date)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

/** The week holding `today`, Monday to Sunday. */
export function weekRange(today: string): DateRange {
  const ms = dayMs(today);
  /** Days since Monday: getUTCDay is 0 on Sunday. */
  const back = (new Date(ms).getUTCDay() + 6) % 7;
  const from = dateOfMs(ms - back * DAY_MS);
  const to = dateOfMs(ms + (6 - back) * DAY_MS);

  return { from, to, label: `this week (${short(from)} – ${short(to)})` };
}

/** The calendar month holding `today`. */
export function monthRange(today: string): DateRange {
  const d = new Date(dayMs(today));
  const [y, m] = [d.getUTCFullYear(), d.getUTCMonth()];
  const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return { from: dateOfMs(Date.UTC(y, m, 1)), to: dateOfMs(Date.UTC(y, m + 1, 0)), label };
}

export const ALL_TIME: DateRange = { from: "0000-01-01", to: "9999-12-31", label: "all time" };

/** The instants a date range covers in `tz`; `to` is the midnight after the last day. */
export function rangeInstants(range: DateRange, tz: string): { from: number; to: number } {
  return {
    from: wallToInstant(dayMs(range.from), tz),
    to: wallToInstant(dayMs(range.to) + DAY_MS, tz),
  };
}
