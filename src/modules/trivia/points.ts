import type { PointsSource } from "../../core/points-types.ts";

/**
 * Trivia pays per right answer in sessions of any length, so for gacha currency each player's
 * trivia counts at most this much a day (about one daily game's worth). The trivia leaderboard
 * still counts every point.
 */
export const TRIVIA_DAILY_CAP = 150;

/** Each UTC day's trivia points, capped, summed; UTC days are within an hour of Lisbon's. */
const CAPPED = `SELECT COALESCE(SUM(MIN(day, ${TRIVIA_DAILY_CAP})), 0) AS n FROM (
    SELECT SUM(points) AS day FROM trivia_scores
    WHERE guild_id = ? AND user_id = ?
    GROUP BY date(at / 1000, 'unixepoch'))`;

export const triviaPoints: PointsSource[] = [
  {
    game: "trivia",
    label: `Trivia (max ${TRIVIA_DAILY_CAP} a day)`,
    earned: (db, who) =>
      db.query<{ n: number }, [string, string]>(CAPPED).get(who.guildId, who.userId)?.n ?? 0,
  },
];
