import type { Database } from "bun:sqlite";

/** One player in one server. */
export interface PlayerRef {
  guildId: string;
  userId: string;
}

/** A game's points, all time, for one player in one server; the gacha balance sums them. */
export interface PointsSource {
  /** Stable key, e.g. "word" or "duo". */
  game: string;
  /** Shown in /gacha balance, e.g. "Word Duo". */
  label: string;
  earned(db: Database, who: PlayerRef): number;
}

/**
 * How a game stores its points: a table with a guild_id column, the column naming the player,
 * the per-row points expression and an extra condition. All are code constants, never user input.
 */
export interface PointsTable {
  game: string;
  label: string;
  table: string;
  /** Defaults to "points". */
  expr?: string;
  /** Defaults to "user_id". */
  user?: string;
  /** Rows that count, e.g. "finished_at IS NOT NULL". */
  where?: string;
}
