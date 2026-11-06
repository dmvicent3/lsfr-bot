import type { Database } from "bun:sqlite";
import { TRIVIA_DAILY_CAP, todayTowardCap } from "../../trivia/currency.ts";
import { awardsOf } from "../../trivia/points.ts";
import { TRIVIA_TZ } from "../../trivia/zone.ts";
import { done, open } from "../status/entry.ts";
import type { DailyEntry, Who } from "../types.ts";

/** Trivia's daily gacha allowance: done once today's points reach the cap. */
export function triviaToday(db: Database, who: Who, now: number): DailyEntry {
  const got = todayTowardCap(awardsOf(db, who), now);
  const progress = `${got}/${TRIVIA_DAILY_CAP}`;
  const base = { command: "trivia start", tz: TRIVIA_TZ };

  if (got >= TRIVIA_DAILY_CAP)
    return done({ ...base, label: "Trivia" }, `${progress} for the gacha`);

  return open({ ...base, label: got > 0 ? `Trivia ${progress}` : "Trivia" }, got > 0);
}
