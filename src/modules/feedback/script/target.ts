import type { Database } from "bun:sqlite";
import { pollChannel, pollChannels } from "../settings.ts";
import type { PollTarget } from "./types.ts";

const SET_IT = "set one with /feedback settings";

/** The server and channel for a poll; a string is why there is none. */
export function pollTarget(db: Database, guildId: string | null): PollTarget | string {
  if (guildId) {
    const channelId = pollChannel(db, guildId);

    return channelId ? { guildId, channelId } : `Server ${guildId} has no poll channel; ${SET_IT}.`;
  }

  const all = pollChannels(db);
  const [only] = all;

  if (all.length === 1 && only) return only;

  return all.length === 0
    ? `No server has a poll channel; ${SET_IT}.`
    : `Several servers have a poll channel (${all.map((t) => t.guildId).join(", ")}); pass --guild <id>.`;
}
