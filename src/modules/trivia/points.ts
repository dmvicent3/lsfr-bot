import type { PointsSource } from "../../core/points-types.ts";

/**
 * Trivia pays per right answer in sessions of any length, so for gacha currency each player's
 * trivia counts at most this much a day (about one daily game's worth). The trivia leaderboard
 * still counts every point.
 */
export const TRIVIA_DAILY_CAP = 150;

/** The gacha's launch day (UTC): trivia from before it counts in full, so no one starts lower. */
export const CAP_FROM = "2026-11-06";

/** Each UTC day's trivia points, capped from launch day on, summed. */
const CAPPED = `SELECT COALESCE(SUM(CASE WHEN d < '${CAP_FROM}' THEN day
    ELSE MIN(day, ${TRIVIA_DAILY_CAP}) END), 0) AS n FROM (
    SELECT date(at / 1000, 'unixepoch') AS d, SUM(points) AS day FROM trivia_scores
    WHERE guild_id = ? AND user_id = ?
    GROUP BY d)`;

export const triviaPoints: PointsSource[] = [
  {
    game: "trivia",
    label: `Trivia (max ${TRIVIA_DAILY_CAP} a day)`,
    earned: (db, who) =>
      db.query<{ n: number }, [string, string]>(CAPPED).get(who.guildId, who.userId)?.n ?? 0,
  },
];
