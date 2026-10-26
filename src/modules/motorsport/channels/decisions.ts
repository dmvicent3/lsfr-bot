import type { EventSchedule, Session } from "../types.ts";

/** Discord allows ~2 channel renames per 10 minutes. */
export const RENAME_MIN_INTERVAL_MS = 5 * 60_000;
export const PING_DELETE_AFTER_MS = 3 * 3_600_000;

export function shouldRename(
  current: string | null,
  desired: string,
  renamedAt: number | null,
  now: number,
): boolean {
  if (current === desired) return false;

  return renamedAt === null || now - renamedAt >= RENAME_MIN_INTERVAL_MS;
}

export function sessionKey(s: { eventId: string; sessionId: string }): string {
  return `${s.eventId}/${s.sessionId}`;
}

export function sessionsToPing(
  sessions: Session[],
  sent: ReadonlySet<string>,
  leadMs: number,
  now: number,
): Session[] {
  return sessions.filter((s) => {
    const start = s.start.getTime();

    return s.pingable && start - leadMs <= now && now < start && !sent.has(sessionKey(s));
  });
}

export function groupEvents(sessions: Session[]): EventSchedule[] {
  const events = new Map<string, EventSchedule>();

  for (const s of sessions.toSorted((a, b) => a.start.getTime() - b.start.getTime())) {
    const event = events.get(s.eventId);

    if (event) event.sessions.push(s);
    else events.set(s.eventId, { eventId: s.eventId, eventName: s.eventName, sessions: [s] });
  }

  return [...events.values()];
}

export function currentEvent(sessions: Session[], now: number): EventSchedule | null {
  return (
    groupEvents(sessions).find((event) => event.sessions.some((s) => s.end.getTime() > now)) ?? null
  );
}

/**
 * Series channels are read-only, but the owner and admins bypass channel permissions, so the
 * bot removes anything not its own, plus its own system notices ("pinned a message").
 */
export function shouldDeleteMessage(
  m: { channelId: string; authorId: string; botId: string; system: boolean },
  seriesChannelIds: ReadonlySet<string>,
): boolean {
  return seriesChannelIds.has(m.channelId) && (m.authorId !== m.botId || m.system);
}

/** The event without sessions whose ping already went out (too late for a reminder). */
export function withoutPinged(event: EventSchedule, sent: ReadonlySet<string>): EventSchedule {
  return { ...event, sessions: event.sessions.filter((s) => !sent.has(sessionKey(s))) };
}
