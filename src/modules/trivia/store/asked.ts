import type { Database } from "bun:sqlite";
import type { AskedKind } from "./types.ts";

/** trivia_asked: one row each time a question or KAOS list is asked. */
export class AskedStore {
  constructor(private readonly db: Database) {}

  add(a: {
    guildId: string;
    channelId: string;
    kind: AskedKind;
    itemId: number;
    at: number;
  }): void {
    this.db
      .query(
        "INSERT INTO trivia_asked (guild_id, channel_id, kind, item_id, asked_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(a.guildId, a.channelId, a.kind, a.itemId, a.at);
  }

  /** `<kind>:<id>` → when it was last asked in this server. */
  lastAskedMap(guildId: string): Map<string, number> {
    const rows = this.db
      .query<{ kind: string; item_id: number; at: number }, [string]>(
        `SELECT kind, item_id, MAX(asked_at) AS at FROM trivia_asked
         WHERE guild_id = ? GROUP BY kind, item_id`,
      )
      .all(guildId);

    return new Map(rows.map((r) => [`${r.kind}:${r.item_id}`, r.at]));
  }

  lastInChannel(channelId: string): { kind: AskedKind; itemId: number } | null {
    const row = this.db
      .query<{ kind: AskedKind; item_id: number }, [string]>(
        "SELECT kind, item_id FROM trivia_asked WHERE channel_id = ? ORDER BY asked_at DESC, rowid DESC LIMIT 1",
      )
      .get(channelId);

    return row ? { kind: row.kind, itemId: row.item_id } : null;
  }
}
