import type { Guild } from "discord.js";
import type { MotorsportRepo } from "./repo.ts";
import { seriesInfo } from "./series.ts";
import type { SeriesKey } from "./types.ts";

export function notFollowedText(series: SeriesKey): string {
  return `${seriesInfo(series).name} isn't followed. Use /motorsport follow first.`;
}

/** Adds or removes the series role for a user. Returns the reply text. */
export async function togglePings(
  guild: Guild,
  repo: MotorsportRepo,
  userId: string,
  series: SeriesKey,
): Promise<string> {
  const followed = repo.getFollowed(series);
  if (!followed) return notFollowedText(series);
  const member = await guild.members.fetch(userId);
  const has = member.roles.cache.has(followed.roleId);
  await (has ? member.roles.remove(followed.roleId) : member.roles.add(followed.roleId));
  return `Season pings for ${seriesInfo(series).name}: ${has ? "off" : "on"}`;
}

/** Toggles a one-off reminder for an upcoming pingable session. Returns the reply text. */
export function toggleReminder(
  repo: MotorsportRepo,
  userId: string,
  series: SeriesKey,
  eventId: string | null,
  sessionId: string,
  now: number,
): string {
  if (!repo.getFollowed(series)) return notFollowedText(series);
  const session = repo
    .listSessions(series)
    .find(
      (s) =>
        s.eventId === eventId && s.sessionId === sessionId && s.pingable && s.start.getTime() > now,
    );
  if (!session) return `That session isn't in the next ${seriesInfo(series).name} event.`;
  const set = repo.toggleOneOff(userId, series, session.eventId, session.sessionId);
  return `Reminder ${set ? "set" : "removed"} for ${session.eventName} ${session.title}.`;
}
