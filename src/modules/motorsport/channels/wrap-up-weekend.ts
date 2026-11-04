import type { Guild } from "discord.js";
import { safely } from "../../../core/scheduler.ts";
import { deleteIsHopeless } from "../errors.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { OpenThread, SeriesKey } from "../types.ts";
import { fetchSeriesChannel } from "./lookup.ts";
import type { SeriesChannel } from "./types.ts";
import { weekendsToWrapUp } from "./wrap-up.ts";

/**
 * Wraps up finished weekends: deletes their channel posts and the thread's starter message
 * (a thread started from a message shares its id), then archives and locks the thread.
 */
export async function wrapUpWeekends(
  repo: MotorsportRepo,
  guild: Guild,
  now: number,
): Promise<void> {
  for (const f of repo.followed.list()) {
    const due = weekendsToWrapUp(repo.sessions.list(f.series), repo.threads.open(f.series), now);

    if (due.length === 0) continue;

    const channel = await fetchSeriesChannel(guild, f);

    if (!channel) continue;

    for (const weekend of due) {
      await safely(`motorsport:wrapup:${f.series}`, () => wrapUp(channel, repo, f.series, weekend));
    }
  }
}

async function wrapUp(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  series: SeriesKey,
  { eventId, threadId }: OpenThread,
): Promise<void> {
  for (const messageId of repo.channelPosts.list(series, eventId)) {
    await hopefully(() => channel.messages.delete(messageId));
    repo.channelPosts.remove(messageId);
  }

  await hopefully(() => channel.messages.delete(threadId));
  await hopefully(async () => {
    const thread = await channel.threads.fetch(threadId);

    if (!thread) return;

    // Discord only edits an archived thread when the edit un-archives it.
    if (thread.archived) await thread.setArchived(false);

    await thread.edit({ locked: true, archived: true, reason: "Weekend over" });
  });
  repo.threads.close(series, eventId);
}

/** Runs a delete or close; one that can never succeed (gone, no access) counts as done. */
async function hopefully(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (!deleteIsHopeless(err)) throw err;
  }
}
