import type { Guild } from "discord.js";
import { safely } from "../../../core/scheduler.ts";
import { pingDeleteIsHopeless } from "../errors.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { DuePing } from "../types.ts";

/** Deletes every ping message past its delete time; one that can never be deleted is dropped. */
export async function deleteDuePings(
  repo: MotorsportRepo,
  guildOf: () => Promise<Guild>,
  now: number,
): Promise<void> {
  const due = repo.pings.dueDeletes(now);

  if (due.length === 0) return;

  const guild = await guildOf();

  for (const ping of due) {
    await safely(`motorsport:cleanup:${ping.series}`, () => deletePing(guild, repo, ping));
  }
}

async function deletePing(guild: Guild, repo: MotorsportRepo, ping: DuePing): Promise<void> {
  try {
    const channel = await guild.channels.fetch(ping.channelId);

    if (channel?.isTextBased()) await channel.messages.delete(ping.messageId);
  } catch (err) {
    if (!pingDeleteIsHopeless(err)) throw err;
  }

  repo.pings.markDeleted(ping.series, ping.eventId, ping.sessionId);
}
