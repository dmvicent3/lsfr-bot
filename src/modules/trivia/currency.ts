import { dateIn } from "../../core/zoned.ts";
import { TRIVIA_TZ } from "./zone.ts";

/**
 * Trivia pays per right answer in sessions of any length, so for gacha currency each player's
 * trivia counts at most this much a day (about one daily game's worth). The trivia leaderboard
 * still counts every point.
 */
export const TRIVIA_DAILY_CAP = 150;

/** The gacha's launch day: trivia from before it counts in full, so no one starts lower. */
export const CAP_FROM = "2026-11-06";

/** One trivia point award: when, and how many. */
export interface Award {
  at: number;
  points: number;
}

/** Points per trivia day (`TRIVIA_TZ`), keyed by date. */
export function byDay(awards: readonly Award[]): Map<string, number> {
  const days = new Map<string, number>();

  for (const a of awards) {
    const d = dateIn(a.at, TRIVIA_TZ);
    days.set(d, (days.get(d) ?? 0) + a.points);
  }

  return days;
}

/** Trivia's gacha currency: each day from launch capped, earlier days in full, summed. */
export function cappedTotal(awards: readonly Award[]): number {
  let total = 0;

  for (const [d, points] of byDay(awards)) {
    total += d < CAP_FROM ? points : Math.min(points, TRIVIA_DAILY_CAP);
  }

  return total;
}

/** What today's trivia has given toward the cap so far, at most the cap. */
export const todayTowardCap = (awards: readonly Award[], now: number): number =>
  Math.min(byDay(awards).get(dateIn(now, TRIVIA_TZ)) ?? 0, TRIVIA_DAILY_CAP);
