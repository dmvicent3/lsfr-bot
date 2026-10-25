import type { SeriesChannel } from "./types.ts";
import { RESTJSONErrorCodes, ThreadAutoArchiveDuration, type ThreadChannel } from "discord.js";
import { keyedLock } from "../../../core/scheduler.ts";
import { isDiscordError } from "./lookup.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { PostTarget } from "../types.ts";

const MAX_THREAD_NAME = 100;

/** Results and rulings jobs may both open a weekend's thread at once: one at a time. */
const threadLock = keyedLock();

/**
 * The weekend's results thread: the stored one (unarchived if it went quiet), or a new one
 * started from a short message in the channel when there's none or it was deleted.
 */
export async function eventThread(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  target: PostTarget,
): Promise<ThreadChannel> {
  return threadLock(`${target.series}/${target.eventId}`, async () => {
    const stored = await storedThread(channel, repo.threads.get(target.series, target.eventId));
    return stored ?? startThread(channel, repo, target);
  });
}

/** The stored thread, unarchived; null when there is none or it was deleted. */
async function storedThread(
  channel: SeriesChannel,
  threadId: string | null,
): Promise<ThreadChannel | null> {
  if (!threadId) return null;
  try {
    const thread = await channel.threads.fetch(threadId);
    if (thread?.archived) await thread.setArchived(false);
    return thread;
  } catch (err) {
    if (isDiscordError(err, RESTJSONErrorCodes.UnknownChannel)) return null;
    throw err;
  }
}

async function startThread(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  target: PostTarget,
): Promise<ThreadChannel> {
  const about = target.series === "f1" ? "results & stewards' rulings" : "results";
  const starter = await channel.send({
    content: `🏁 **${target.eventName}**: ${about} in the thread below`,
    allowedMentions: { parse: [] },
  });
  const thread = await starter.startThread({
    name: `🏁 ${target.eventName}`.slice(0, MAX_THREAD_NAME),
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
  });
  repo.threads.set(target.series, target.eventId, thread.id);
  return thread;
}
