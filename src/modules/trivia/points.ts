import type { Database } from "bun:sqlite";
import type { PlayerRef, PointsSource } from "../../core/points-types.ts";
import { type Award, TRIVIA_DAILY_CAP, cappedTotal } from "./currency.ts";

const AWARDS = `SELECT at, points FROM trivia_scores WHERE guild_id = ? AND user_id = ?`;

/** Every trivia point award of one player in one server. */
export const awardsOf = (db: Database, who: PlayerRef): Award[] =>
  db.query<Award, [string, string]>(AWARDS).all(who.guildId, who.userId);

export const triviaPoints: PointsSource[] = [
  {
    game: "trivia",
    label: `Trivia (max ${TRIVIA_DAILY_CAP} a day)`,
    earned: (db, who) => cappedTotal(awardsOf(db, who)),
  },
];
