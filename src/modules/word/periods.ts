import { puzzleNumber } from "../../core/daily.ts";
import { periodRange as coreRange } from "../../core/periods.ts";
import type { DateRange, Period, Track } from "./types.ts";

/** The dates a leaderboard period covers, weeks from Monday; today is named after the track. */
export const periodRange = (
  period: Period,
  today: string,
  track: Pick<Track, "name" | "firstPuzzle">,
): DateRange =>
  coreRange(period, today, (d) => `${track.name} #${puzzleNumber(d, track.firstPuzzle)}`);
