import type { Guild } from "discord.js";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesKey, SessionRef, Viewer } from "../types.ts";

/** A reminder request: `eventId` is null when the series has no upcoming event. */
type ReminderRef = Omit<SessionRef, "eventId"> & { eventId: string | null };

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
  const followed = repo.followed.get(series);
  if (!followed) return notFollowedText(series);
  const member = await guild.members.fetch(userId);
  const has = member.roles.cache.has(followed.roleId);
  await (has ? member.roles.remove(followed.roleId) : member.roles.add(followed.roleId));
  return `Season pings for ${seriesInfo(series).name}: ${has ? "off" : "on"}`;
}

/** Toggles a one-off reminder for an upcoming pingable session. Returns the reply text. */
export function toggleReminder(
  repo: MotorsportRepo,
  { userId, now }: Viewer,
  { series, eventId, sessionId }: ReminderRef,
): string {
  if (!repo.followed.get(series)) return notFollowedText(series);
  const session = repo.sessions
    .list(series)
    .find(
      (s) =>
        s.eventId === eventId && s.sessionId === sessionId && s.pingable && s.start.getTime() > now,
    );
  if (!session) return `That session isn't in the next ${seriesInfo(series).name} event.`;
  if (repo.pings.sentKeys(series).has(`${session.eventId}/${session.sessionId}`)) {
    return `${session.eventName} ${session.title} has already been pinged.`;
  }
  const set = repo.reminders.toggle(userId, series, session.eventId, session.sessionId);
  return `Reminder ${set ? "set" : "removed"} for ${session.eventName} ${session.title}.`;
}

/**
 * Sets the viewer's reminders for one event to exactly the given sessions (ignoring any
 * that aren't upcoming pinged sessions of that event). Returns the reply text.
 */
export function setReminders(
  repo: MotorsportRepo,
  { userId, now }: Viewer,
  { series, eventId }: Omit<SessionRef, "sessionId">,
  sessionIds: string[],
): string {
  if (!repo.followed.get(series)) return notFollowedText(series);
  const eventSessions = repo.sessions.list(series).filter((s) => s.eventId === eventId);
  const eventName = eventSessions[0]?.eventName ?? eventId;
  const wanted = new Set(sessionIds);
  const sent = repo.pings.sentKeys(series);
  const chosen = eventSessions.filter(
    (s) =>
      wanted.has(s.sessionId) &&
      s.pingable &&
      s.start.getTime() > now &&
      !sent.has(`${s.eventId}/${s.sessionId}`),
  );
  const ids = chosen.map((s) => s.sessionId);
  repo.reminders.set(userId, series, eventId, ids);
  if (chosen.length === 0) return `No reminders for ${eventName}.`;
  return `Reminders for ${eventName}: ${chosen.map((s) => s.title).join(", ")}.`;
}
