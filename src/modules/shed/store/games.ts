import type { Database } from "bun:sqlite";

/** shed_games: live while `ended_at` is null, one live game per channel. */
export class GameStore {
  constructor(private readonly db: Database) {}

  /** The new game's id; null when the channel already has a live one. */
  start(g: {
    guildId: string;
    channelId: string;
    startedBy: string;
    stacking: boolean;
    at: number;
  }): number | null {
    return this.db.transaction(() => {
      const live = this.db
        .query("SELECT 1 FROM shed_games WHERE channel_id = ? AND ended_at IS NULL")
        .get(g.channelId);

      if (live) return null;

      const { lastInsertRowid } = this.db
        .query(
          "INSERT INTO shed_games (guild_id, channel_id, started_by, started_at, stacking) VALUES (?, ?, ?, ?, ?)",
        )
        .run(g.guildId, g.channelId, g.startedBy, g.at, g.stacking ? 1 : 0);

      return Number(lastInsertRowid);
    })();
  }

  /** The board message, so a restart can tidy it. */
  setMessage(id: number, messageId: string): void {
    this.db.query("UPDATE shed_games SET message_id = ? WHERE id = ?").run(messageId, id);
  }

  /** `players`: how many were dealt in; null when the game never started. */
  end(id: number, at: number, players: number | null): void {
    this.db
      .query("UPDATE shed_games SET ended_at = ?, players = ? WHERE id = ? AND ended_at IS NULL")
      .run(at, players, id);
  }

  /** Ends games a restart left live; their boards, to tidy. */
  endAllLive(at: number): { channelId: string; messageId: string | null }[] {
    return this.db.transaction(() => {
      const live = this.db
        .query<{ channelId: string; messageId: string | null }, []>(
          "SELECT channel_id AS channelId, message_id AS messageId FROM shed_games WHERE ended_at IS NULL ORDER BY id",
        )
        .all();
      this.db.query("UPDATE shed_games SET ended_at = ? WHERE ended_at IS NULL").run(at);

      return live;
    })();
  }
}
