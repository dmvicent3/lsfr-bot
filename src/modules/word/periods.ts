import { periodRange as coreRange } from "../../core/periods.ts";
import { puzzleNumber } from "./puzzle-date.ts";
import type { DateRange, Period } from "./types.ts";

/** The dates a leaderboard period covers, weeks from Monday. */
export const periodRange = (period: Period, today: string): DateRange =>
  coreRange(period, today, (d) => `Word #${puzzleNumber(d)}`);
