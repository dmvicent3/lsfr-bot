import { puzzleNumber } from "../../core/daily.ts";
import { ALL_TIME, monthRange, weekRange } from "../../core/periods.ts";
import type { DateRange } from "../../core/types.ts";
import type { Period } from "./types.ts";

/** The date of puzzle #1. */
export const FIRST_PUZZLE = "2026-11-03";

const RANGES: Record<Period, (today: string) => DateRange> = {
  today: (today) => ({
    from: today,
    to: today,
    label: `Sudoku #${puzzleNumber(today, FIRST_PUZZLE)}`,
  }),
  week: weekRange,
  month: monthRange,
  all: () => ALL_TIME,
};

/** The dates a leaderboard period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange => RANGES[period](today);
