import type { Picks, FullPicks, Driver } from "./types.ts";
import { resultKind } from "../results/results.ts";
import type { SeriesKey } from "../types.ts";
import { rulesOf } from "./rules.ts";

export const isComplete = (picks: Picks): picks is FullPicks => picks.every((p) => p !== null);

export function isPredictable(series: SeriesKey, sessionId: string): boolean {
  const kind = resultKind(series, sessionId);

  return kind !== null && rulesOf(series).kinds.includes(kind);
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
