import type { Weekend } from "./types.ts";
import { groupEvents } from "../channels/decisions.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { SeriesKey, Viewer } from "../types.ts";
import { isLocked, openPredictions, weekendLock } from "./lock.ts";
import { rulesOf } from "./rules.ts";

/** The weekend as one viewer sees it, or null when it isn't on the schedule. */
export function loadWeekend(
  repo: MotorsportRepo,
  { userId, now }: Viewer,
  series: SeriesKey,
  eventId: string,
): Weekend | null {
  const event = groupEvents(repo.sessions.list(series)).find((e) => e.eventId === eventId);

  if (!event) return null;

  const chip = rulesOf(series).fantasy ? repo.chips.get(series, eventId, userId) : null;
  const lateSwap = chip?.kind === "lateswap";
  const lock = weekendLock(event)?.getTime() ?? now;

  return {
    series,
    event,
    chip,
    locked: isLocked(event, now),
    open: openPredictions(event, { now, lateSwap }),
    season: new Date(lock).getUTCFullYear(),
  };
}
