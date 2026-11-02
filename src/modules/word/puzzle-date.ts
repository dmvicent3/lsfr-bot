import { puzzleNumber as dailyNumber } from "../../core/daily.ts";

export const FIRST_PUZZLE = "2026-10-28";

/** #1 on launch day, one more each day. */
export const puzzleNumber = (date: string): number => dailyNumber(date, FIRST_PUZZLE);
