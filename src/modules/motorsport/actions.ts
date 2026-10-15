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
  if (repo.sentKeys(series).has(`${session.eventId}/${session.sessionId}`)) {
    return `${session.eventName} ${session.title} has already been pinged.`;
  }
  const set = repo.toggleOneOff(userId, series, session.eventId, session.sessionId);
  return `Reminder ${set ? "set" : "removed"} for ${session.eventName} ${session.title}.`;
}

/**
 * Sets the user's reminders for one event to exactly the given sessions (ignoring any that
 * aren't upcoming pinged sessions of that event). Returns the reply text.
 */
export function setReminders(
  repo: MotorsportRepo,
  userId: string,
  series: SeriesKey,
  eventId: string,
  sessionIds: string[],
  now: number,
): string {
  if (!repo.getFollowed(series)) return notFollowedText(series);
  const eventSessions = repo.listSessions(series).filter((s) => s.eventId === eventId);
  const eventName = eventSessions[0]?.eventName ?? eventId;
  const wanted = new Set(sessionIds);
  const sent = repo.sentKeys(series);
  const chosen = eventSessions.filter(
    (s) =>
      wanted.has(s.sessionId) &&
      s.pingable &&
      s.start.getTime() > now &&
      !sent.has(`${s.eventId}/${s.sessionId}`),
  );
  repo.setOneOffs(
    userId,
    series,
    eventId,
    chosen.map((s) => s.sessionId),
  );
  return chosen.length === 0
    ? `No reminders for ${eventName}.`
    : `Reminders for ${eventName}: ${chosen.map((s) => s.title).join(", ")}.`;
}
