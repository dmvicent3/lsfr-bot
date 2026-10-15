import type { EventSchedule, Session } from "./types.ts";

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
