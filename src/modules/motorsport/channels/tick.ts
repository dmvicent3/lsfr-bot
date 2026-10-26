import type { SeriesChannel } from "./types.ts";
import { RateLimitError } from "discord.js";
import { log } from "../../../core/log.ts";
import { currentEvent, shouldRename } from "./decisions.ts";
import { fetchSeriesChannel, fetchSeriesRole } from "./lookup.ts";
import { updatePinned } from "./pinned.ts";
import { deleteSeriesChannel } from "./setup.ts";
import { sendPings } from "../pings/send.ts";
import type { TickRun } from "../pings/types.ts";
import type { MotorsportRepo } from "../repo.ts";
import { channelName } from "../time.ts";
import type { Followed } from "../types.ts";

/**
 * One series' minute: pings due sessions, moves the pinned schedule on to the next event and
 * renames the channel. A deleted channel or role unfollows the series.
 */
export async function tickSeries(run: TickRun): Promise<void> {
  const { guild, repo, followed: f, now } = run;
  const [channel, role] = await Promise.all([
    fetchSeriesChannel(guild, f),
    fetchSeriesRole(guild, f),
  ]);

  if (!channel || !role) {
    log.info("motorsport:tick", `${f.series} channel or role was deleted, unfollowing`);
    await deleteSeriesChannel(guild, f);
    repo.deleteSeries(f.series);

    return;
  }

  // Pings first: they are time-critical, the rename is cosmetic.
  await sendPings(run, channel, role);

  const sessions = repo.sessions.list(f.series);

  if ((currentEvent(sessions, now)?.eventId ?? null) !== f.pinnedEventId) {
    await updatePinned(channel, repo, f, now);
  }

  const desired = channelName(f.series, sessions, new Date(now));

  if (shouldRename(f.channelName, desired, f.renamedAt, now)) {
    await rename(channel, repo, f, { desired, now });
  }
}

async function rename(
  channel: SeriesChannel,
  repo: MotorsportRepo,
  f: Followed,
  { desired, now }: { desired: string; now: number },
): Promise<void> {
  try {
    await channel.setName(desired);
    repo.followed.update(f.series, { channelName: desired, renamedAt: now });
  } catch (err) {
    if (!(err instanceof RateLimitError)) throw err;

    // Someone else used the rename budget; back off for one throttle window.
    repo.followed.update(f.series, { renamedAt: now });
    log.info("motorsport:tick", `${f.series} rename rate-limited, retrying later`);
  }
}
