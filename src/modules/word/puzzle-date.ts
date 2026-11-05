import { puzzleNumber as dailyNumber } from "../../core/daily.ts";

export const FIRST_PUZZLE = "2026-10-28";

/** Word Duo and Word Quad #1; move to their launch day. */
export const FIRST_MULTI_PUZZLE = "2026-11-05";

/** #1 on launch day, one more each day. */
export const puzzleNumber = (date: string): number => dailyNumber(date, FIRST_PUZZLE);
