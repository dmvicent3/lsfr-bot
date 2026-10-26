import type { SeriesChannel } from "./types.ts";
import { type Message, RESTJSONErrorCodes } from "discord.js";
import { keyedLock } from "../../../core/scheduler.ts";
import { currentEvent } from "./decisions.ts";
import { isDiscordError } from "./lookup.ts";
import { renderSchedule } from "./render.ts";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { Followed } from "../types.ts";

/** Refresh and tick both update pinned schedules; one series at a time, or both re-post. */
const pinnedLock = keyedLock();

/**
 * Re-renders the pinned schedule for the event that is current at `now`. Re-posts and pins
 * it if someone deleted the original.
 */
export async function updatePinned(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  f: Followed,
  now: number,
): Promise<void> {
  await pinnedLock(f.series, async () => {
    // Re-read: another run may have re-posted (and re-pointed) the message meanwhile.
    const current = repo.followed.get(f.series);

    if (current) await renderPinned(channel, repo, current, now);
  });
}

async function renderPinned(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  f: Followed,
  now: number,
): Promise<void> {
  const event = currentEvent(repo.sessions.list(f.series), now);
  const payload = renderSchedule(
    seriesInfo(f.series),
    event,
    repo.weather.bySession(f.series),
    event ? repo.predictions.counts(f.series, event.eventId) : new Map(),
  );
  let message: Message;

  try {
    message = await channel.messages.fetch(f.pinnedMessageId);
    await message.edit(payload);
  } catch (err) {
    if (!isDiscordError(err, RESTJSONErrorCodes.UnknownMessage)) throw err;

    message = await channel.send(payload);
    await message.pin();
  }

  repo.followed.update(f.series, {
    pinnedMessageId: message.id,
    pinnedEventId: event?.eventId ?? null,
  });
}
