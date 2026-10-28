import { DAY_MS, dateOfMs, dayMs, puzzleNumber } from "./puzzle-date.ts";
import type { DateRange, Period } from "./types.ts";

const short = (date: string): string =>
  new Date(dayMs(date)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

function week(today: string): DateRange {
  const ms = dayMs(today);
  /** Days since Monday: getUTCDay is 0 on Sunday. */
  const back = (new Date(ms).getUTCDay() + 6) % 7;
  const from = dateOfMs(ms - back * DAY_MS);
  const to = dateOfMs(ms + (6 - back) * DAY_MS);

  return { from, to, label: `this week (${short(from)} – ${short(to)})` };
}

function month(today: string): DateRange {
  const d = new Date(dayMs(today));
  const [y, m] = [d.getUTCFullYear(), d.getUTCMonth()];
  const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return { from: dateOfMs(Date.UTC(y, m, 1)), to: dateOfMs(Date.UTC(y, m + 1, 0)), label };
}

const RANGES: Record<Period, (today: string) => DateRange> = {
  today: (today) => ({ from: today, to: today, label: `Word #${puzzleNumber(today)}` }),
  week,
  month,
  all: () => ({ from: "0000-01-01", to: "9999-12-31", label: "all time" }),
};

/** The dates a leaderboard period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange => RANGES[period](today);
