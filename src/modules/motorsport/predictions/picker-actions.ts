import type { Driver, Weekend } from "./types.ts";
import type { FetchFn } from "../../../core/types.ts";
import { latestResult } from "../results/collect-results.ts";
import type { SchedulePayload } from "../channels/types.ts";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesKey, SessionRef, Viewer } from "../types.ts";
import { chipsUsed } from "./chip-actions.ts";
import { chipMenu, weekendChipLabel } from "./chip-options.ts";
import { lockPhase } from "./lock.ts";
import { renderPredictPicker } from "./picker.ts";
import { rulesOf } from "./rules.ts";
import { loadWeekend } from "./weekend.ts";

/** A picker request: `sessionId` absent means the event's first open session. */
type PickerRef = Omit<SessionRef, "sessionId"> & { sessionId: string | undefined };

/**
 * Drivers to pick from, in the order they finished the latest result: the stored one, or
 * fetched live before any result has been stored.
 */
export async function predictionGrid(
  repo: MotorsportRepo,
  series: SeriesKey,
  now: number,
  fetchFn: FetchFn,
): Promise<Driver[]> {
  const stored = repo.results.latest(series);
  const rows =
    stored && stored.rows.length > 0
      ? stored.rows
      : ((await latestResult(repo, series, now, fetchFn))?.rows ?? []);

  return rows.map(({ id, name }) => ({ id, name }));
}

/** Nothing left to pick: other series ran out of sessions, a fantasy weekend locked. */
function nothingOpen(series: SeriesKey, weekend: Weekend | null): string {
  if (!weekend || !rulesOf(series).fantasy)
    return "No races or sprints left to predict this weekend.";

  const label = weekendChipLabel(weekend);
  const chip = label ? ` Chip: ${label}.` : "";

  return `🔒 The ${weekend.event.eventName} weekend is locked: predictions closed at its first session.${chip}`;
}

/** The viewer's picker for the requested session, or why there is nothing to pick. */
export async function predictPicker(
  repo: MotorsportRepo,
  viewer: Viewer,
  { series, eventId, sessionId }: PickerRef,
  fetchFn: FetchFn,
): Promise<SchedulePayload | string> {
  const weekend = loadWeekend(repo, viewer, series, eventId);
  const open = weekend?.open ?? [];
  const session = open.find((s) => s.sessionId === sessionId) ?? open[0];

  if (!weekend || !session) return nothingOpen(series, weekend);

  const grid = await predictionGrid(repo, series, viewer.now, fetchFn);

  if (grid.length === 0) {
    return "No driver list yet: predictions open once the first session's results are in.";
  }

  return renderPredictPicker({
    info: seriesInfo(series),
    eventName: weekend.event.eventName,
    session,
    grid,
    picks: repo.predictions.get(viewer.userId, series, eventId, session.sessionId),
    others: open.filter((s) => s !== session),
    lock: lockPhase(weekend.event, session, viewer.now),
    chips: rulesOf(series).fantasy ? chipMenu(weekend, chipsUsed(repo, viewer, weekend)) : null,
  });
}
