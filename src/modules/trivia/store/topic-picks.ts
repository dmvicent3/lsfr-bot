import type { Database } from "bun:sqlite";

/** trivia_topic_picks: one row per topic a sole survivor chose. */
export class TopicPickStore {
  constructor(private readonly db: Database) {}

  add(p: { guildId: string; userId: string; category: string; at: number }): void {
    this.db
      .query("INSERT INTO trivia_topic_picks (guild_id, user_id, category, at) VALUES (?, ?, ?, ?)")
      .run(p.guildId, p.userId, p.category, p.at);
  }

  count(guildId: string, userId: string): number {
    const row = this.db
      .query<{ n: number }, [string, string]>(
        "SELECT COUNT(*) AS n FROM trivia_topic_picks WHERE guild_id = ? AND user_id = ?",
      )
      .get(guildId, userId);

    return row?.n ?? 0;
  }
}
