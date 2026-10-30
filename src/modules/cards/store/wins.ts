import type { Database } from "bun:sqlite";

export interface WinRow {
  gameId: number;
  guildId: string;
  userId: string;
  at: number;
  /** The prompt with the winning answer filled in. */
  prompt: string;
  votes: number;
}

export interface CardStats {
  games: number;
  gamesWon: number;
  roundsWon: number;
  best: { prompt: string; votes: number } | null;
}

type Counts = Omit<CardStats, "best">;

const COUNTS = `SELECT
  (SELECT COUNT(*) FROM cards_players p JOIN cards_games g ON g.id = p.game_id
    WHERE g.guild_id = ?1 AND p.user_id = ?2) AS games,
  (SELECT COUNT(*) FROM cards_games WHERE guild_id = ?1 AND winner_id = ?2) AS gamesWon,
  (SELECT COUNT(*) FROM cards_wins WHERE guild_id = ?1 AND user_id = ?2) AS roundsWon`;

/** cards_wins: one row per round win; leaderboards and stats come from here. */
export class WinStore {
  constructor(private readonly db: Database) {}

  add(rows: WinRow[]): void {
    const insert = this.db.query(
      "INSERT INTO cards_wins (game_id, guild_id, user_id, at, prompt, votes) VALUES (?, ?, ?, ?, ?, ?)",
    );
    this.db.transaction(() => {
      for (const r of rows) insert.run(r.gameId, r.guildId, r.userId, r.at, r.prompt, r.votes);
    })();
  }

  /** Round wins per player from `from` up to (not including) `to`; most first, ties by user ID. */
  standings(guildId: string, from: number, to: number): { userId: string; wins: number }[] {
    return this.db
      .query<{ userId: string; wins: number }, [string, number, number]>(
        `SELECT user_id AS userId, COUNT(*) AS wins FROM cards_wins
         WHERE guild_id = ? AND at >= ? AND at < ? GROUP BY user_id ORDER BY wins DESC, user_id`,
      )
      .all(guildId, from, to);
  }

  stats(guildId: string, userId: string): CardStats {
    const counts = this.db.query<Counts, [string, string]>(COUNTS).get(guildId, userId);
    const best = this.db
      .query<{ prompt: string; votes: number }, [string, string]>(
        `SELECT prompt, votes FROM cards_wins WHERE guild_id = ? AND user_id = ?
         ORDER BY votes DESC, at LIMIT 1`,
      )
      .get(guildId, userId);

    return { games: 0, gamesWon: 0, roundsWon: 0, ...counts, best: best ?? null };
  }
}
