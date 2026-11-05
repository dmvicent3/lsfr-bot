import { puzzleNumber } from "../../core/daily.ts";
import { periodRange as coreRange } from "../../core/periods.ts";
import type { DateRange } from "../../core/types.ts";
import type { Period } from "./ranking-types.ts";

/** The date of puzzle #1; move to the launch day. */
export const FIRST_PUZZLE = "2026-11-06";

/** The dates a leaderboard period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange =>
  coreRange(period, today, (d) => `Snake #${puzzleNumber(d, FIRST_PUZZLE)}`);
