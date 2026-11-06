import { puzzleNumber } from "../../../core/daily.ts";
import { periodRange as coreRange } from "../../../core/periods.ts";
import type { DateRange, Period } from "../../../core/types.ts";

/** The date of daily #1. */
export const FIRST_PUZZLE = "2026-11-06";

export const dailyNumber = (date: string): number => puzzleNumber(date, FIRST_PUZZLE);

/** The dates a leaderboard period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange =>
  coreRange(period, today, (d) => `Minesweeper #${dailyNumber(d)}`);
