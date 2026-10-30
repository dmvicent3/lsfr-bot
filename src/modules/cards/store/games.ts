import type { Database } from "bun:sqlite";

/** cards_games and cards_players: live while `ended_at` is null, one live game per channel. */
export class GameStore {
  constructor(private readonly db: Database) {}

  /** The new game's id; null when the channel already has a live one. */
  start(g: {
    guildId: string;
    channelId: string;
    startedBy: string;
    target: number;
    at: number;
  }): number | null {
    return this.db.transaction(() => {
      const live = this.db
        .query("SELECT 1 FROM cards_games WHERE channel_id = ? AND ended_at IS NULL")
        .get(g.channelId);

      if (live) return null;

      const { lastInsertRowid } = this.db
        .query(
          "INSERT INTO cards_games (guild_id, channel_id, started_by, started_at, target) VALUES (?, ?, ?, ?, ?)",
        )
        .run(g.guildId, g.channelId, g.startedBy, g.at, g.target);

      return Number(lastInsertRowid);
    })();
  }

  addPlayer(gameId: number, userId: string): void {
    this.db
      .query("INSERT OR IGNORE INTO cards_players (game_id, user_id) VALUES (?, ?)")
      .run(gameId, userId);
  }

  end(id: number, at: number, winnerId: string | null): void {
    this.db
      .query("UPDATE cards_games SET ended_at = ?, winner_id = ? WHERE id = ? AND ended_at IS NULL")
      .run(at, winnerId, id);
  }

  /** Ends games a restart left live; how many there were. */
  endAllLive(at: number): number {
    return this.db.query("UPDATE cards_games SET ended_at = ? WHERE ended_at IS NULL").run(at)
      .changes;
  }
}
