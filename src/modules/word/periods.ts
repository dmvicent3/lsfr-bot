import { ALL_TIME, monthRange, weekRange } from "../../core/periods.ts";
import { puzzleNumber } from "./puzzle-date.ts";
import type { DateRange, Period } from "./types.ts";

const RANGES: Record<Period, (today: string) => DateRange> = {
  today: (today) => ({ from: today, to: today, label: `Word #${puzzleNumber(today)}` }),
  week: weekRange,
  month: monthRange,
  all: () => ALL_TIME,
};

/** The dates a leaderboard period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange => RANGES[period](today);
