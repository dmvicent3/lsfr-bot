import type { Database } from "bun:sqlite";

/** trivia_sessions: live while `ended_at` is null, one live session per channel. */
export class SessionStore {
  constructor(private readonly db: Database) {}

  /** The new session's id; null when the channel already has a live one. */
  start(s: { guildId: string; channelId: string; startedBy: string; at: number }): number | null {
    return this.db.transaction(() => {
      const live = this.db
        .query("SELECT 1 FROM trivia_sessions WHERE channel_id = ? AND ended_at IS NULL")
        .get(s.channelId);

      if (live) return null;

      const { lastInsertRowid } = this.db
        .query(
          "INSERT INTO trivia_sessions (guild_id, channel_id, started_by, started_at) VALUES (?, ?, ?, ?)",
        )
        .run(s.guildId, s.channelId, s.startedBy, s.at);

      return Number(lastInsertRowid);
    })();
  }

  /** False when it had already ended. */
  end(id: number, at: number): boolean {
    const { changes } = this.db
      .query("UPDATE trivia_sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL")
      .run(at, id);

    return changes === 1;
  }

  /** Ends sessions a restart left live; how many there were. */
  endAllLive(at: number): number {
    return this.db.query("UPDATE trivia_sessions SET ended_at = ? WHERE ended_at IS NULL").run(at)
      .changes;
  }
}
