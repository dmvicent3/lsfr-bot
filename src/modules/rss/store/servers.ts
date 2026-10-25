import type { Server, ServerRow } from "./types.ts";
import type { Database } from "bun:sqlite";

/** rss_servers: each server's news channel and whether it was last told jev is down. */
export class ServerStore {
  constructor(private readonly db: Database) {}

  /** Servers with a news channel: the only ones checked. */
  list(): Server[] {
    return this.db
      .query<ServerRow & { channel_id: string }, []>(
        "SELECT guild_id, channel_id, jev_down FROM rss_servers WHERE channel_id IS NOT NULL ORDER BY guild_id",
      )
      .all()
      .map((r) => ({ guildId: r.guild_id, channelId: r.channel_id, jevDown: r.jev_down === 1 }));
  }

  channel(guildId: string): string | null {
    return this.row(guildId)?.channel_id ?? null;
  }

  setChannel(guildId: string, channelId: string | null): void {
    this.upsert(guildId, "channel_id", channelId);
  }

  jevDown(guildId: string): boolean {
    return this.row(guildId)?.jev_down === 1;
  }

  setJevDown(guildId: string, down: boolean): void {
    this.upsert(guildId, "jev_down", down ? 1 : 0);
  }

  private row(guildId: string): ServerRow | null {
    return this.db
      .query<ServerRow, [string]>("SELECT * FROM rss_servers WHERE guild_id = ?")
      .get(guildId);
  }

  private upsert(
    guildId: string,
    name: "channel_id" | "jev_down",
    value: string | number | null,
  ): void {
    this.db.run(
      `INSERT INTO rss_servers (guild_id, ${name}) VALUES (?, ?)
       ON CONFLICT (guild_id) DO UPDATE SET ${name} = excluded.${name}`,
      [guildId, value],
    );
  }
}
