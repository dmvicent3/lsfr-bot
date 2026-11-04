import { resultKind } from "../results/results.ts";
import type { Session } from "../types.ts";

/** A weekend's channel posts go, and its thread is archived, this long after its last result. */
export const WRAP_UP_AFTER_MS = 3 * 24 * 3_600_000;

/**
 * The open weekends due a wrap-up: 3 days after the end of their last result session (any
 * session when the series has no result sessions), or at once when the schedule no longer has
 * the event (a new season replaced it).
 */
export function weekendsToWrapUp<T extends { eventId: string }>(
  sessions: Session[],
  open: T[],
  now: number,
): T[] {
  return open.filter((weekend) => {
    const lastEnd = lastResultEnd(sessions.filter((s) => s.eventId === weekend.eventId));

    return lastEnd === null || now >= lastEnd + WRAP_UP_AFTER_MS;
  });
}

function lastResultEnd(event: Session[]): number | null {
  if (event.length === 0) return null;

  const results = event.filter((s) => resultKind(s.series, s.sessionId) !== null);

  return Math.max(...(results.length > 0 ? results : event).map((s) => s.end.getTime()));
}
