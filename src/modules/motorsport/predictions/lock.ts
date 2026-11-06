import type { LockPhase, OpenState } from "./types.ts";
import { resultKind } from "../results/results.ts";
import type { EventSchedule, Session } from "../types.ts";
import { isPredictable } from "./predictions.ts";
import { rulesOf } from "./rules.ts";

const predictable = (event: EventSchedule): Session[] =>
  event.sessions.filter((s) => isPredictable(s.series, s.sessionId));

const isFantasy = (event: EventSchedule): boolean =>
  event.sessions.some((s) => rulesOf(s.series).fantasy);

const isRace = (s: Session): boolean => resultKind(s.series, s.sessionId) === "race";

/** When a fantasy weekend locks: the start of its first predictable session. */
export function weekendLock(event: EventSchedule): Date | null {
  const starts = predictable(event).map((s) => s.start.getTime());

  return starts.length > 0 ? new Date(Math.min(...starts)) : null;
}

/** True from the weekend lock on (chips freeze then). */
export function isLocked(event: EventSchedule, now: number): boolean {
  const lock = weekendLock(event);

  return lock !== null && lock.getTime() <= now;
}

/**
 * Sessions the viewer can still change picks for. Fantasy weekends: all of them until the
 * weekend lock, then only the race with Late Swap until it starts. Others: each until it starts.
 */
export function openPredictions(event: EventSchedule, { now, lateSwap }: OpenState): Session[] {
  const sessions = predictable(event);

  if (!isFantasy(event)) return sessions.filter((s) => s.start.getTime() > now);

  if (!isLocked(event, now)) return sessions;

  return lateSwap ? sessions.filter((s) => isRace(s) && s.start.getTime() > now) : [];
}

/** Until when the picks of an open `session` can change, and what sets that moment. */
export function lockPhase(event: EventSchedule, session: Session, now: number): LockPhase {
  const lock = weekendLock(event);

  if (!isFantasy(event) || !lock) return { phase: "session", at: session.start };

  return lock.getTime() > now
    ? { phase: "weekend", at: lock }
    : { phase: "lateswap", at: session.start };
}
