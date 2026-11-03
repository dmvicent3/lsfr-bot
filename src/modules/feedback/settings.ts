import type { Database } from "bun:sqlite";
import { getSetting, setSetting } from "../../core/settings.ts";

const PREFIX = "feedback.pollChannel.";

/** Where the script posts polls for a server; null until an admin sets it. */
export const pollChannel = (db: Database, guildId: string): string | null =>
  getSetting(db, PREFIX + guildId);

export const setPollChannel = (db: Database, guildId: string, channelId: string): void =>
  setSetting(db, PREFIX + guildId, channelId);

/** Every server with a poll channel. */
export function pollChannels(db: Database): { guildId: string; channelId: string }[] {
  return db
    .query<{ key: string; value: string }, [number, string]>(
      "SELECT key, value FROM settings WHERE substr(key, 1, ?) = ? ORDER BY key",
    )
    .all(PREFIX.length, PREFIX)
    .map((r) => ({ guildId: r.key.slice(PREFIX.length), channelId: r.value }));
}
