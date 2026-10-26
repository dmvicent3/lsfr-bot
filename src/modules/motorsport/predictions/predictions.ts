import type { Picks, FullPicks, Driver } from "./types.ts";
import { resultKind } from "../results/results.ts";
import type { EventSchedule, SeriesKey, Session } from "../types.ts";

export const isComplete = (picks: Picks): picks is FullPicks => picks.every((p) => p !== null);

export function isPredictable(series: SeriesKey, sessionId: string): boolean {
  const kind = resultKind(series, sessionId);

  return kind === "race" || kind === "sprint";
}

/** The event's races and sprints that haven't started: predictions lock at the start. */
export function openPredictions(event: EventSchedule, now: number): Session[] {
  return event.sessions.filter(
    (s) => isPredictable(s.series, s.sessionId) && s.start.getTime() > now,
  );
}

/** Sets one position; a driver already placed elsewhere swaps with whoever was here. */
export function choosePick(picks: Picks, index: number, id: string): Picks {
  const next: Picks = [...picks];
  const previous = next[index] ?? null;
  const elsewhere = next.indexOf(id);

  if (elsewhere !== -1) next[elsewhere] = previous;

  next[index] = id;

  return next;
}

export const nameIn = (drivers: readonly Driver[], id: string): string =>
  drivers.find((d) => d.id === id)?.name ?? "?";
