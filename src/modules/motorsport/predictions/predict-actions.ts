import type { Driver, PickOutcome, PodiumPick } from "./types.ts";
import type { FetchFn } from "../../../core/types.ts";
import { latestResult } from "../results/collect-results.ts";
import { groupEvents } from "../channels/decisions.ts";
import { choosePick, isComplete, isPredictable, openPredictions } from "./predictions.ts";
import { renderPredictPicker } from "./picker.ts";
import { leaderboard, renderLeaderboard } from "./scoring.ts";
import type { SchedulePayload } from "../channels/types.ts";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesKey, SessionRef, Viewer } from "../types.ts";

/** A picker request: `sessionId` absent means the event's first open race or sprint. */
type PickerRef = Omit<SessionRef, "sessionId"> & { sessionId: string | undefined };

/**
 * Puts the driver at the podium position in the viewer's prediction, until the session
 * starts. `completed` says whether the prediction now counts and didn't before.
 */
export function savePick(
  repo: MotorsportRepo,
  { userId, now }: Viewer,
  ref: SessionRef,
  { index, driverId }: PodiumPick,
): PickOutcome {
  const { series, eventId, sessionId } = ref;
  const session = repo.sessions
    .list(series)
    .find((s) => s.eventId === eventId && s.sessionId === sessionId);
  if (!session || !isPredictable(series, sessionId) || ![0, 1, 2].includes(index)) {
    return { ok: false, text: "That session isn't open for predictions." };
  }
  if (session.start.getTime() <= now) {
    return {
      ok: false,
      text: `🔒 Predictions for the ${session.eventName} ${session.title} closed at the start.`,
    };
  }
  const before = repo.predictions.get(userId, series, eventId, sessionId);
  const picks = choosePick(before, index, driverId);
  repo.predictions.set({ userId, now }, ref, picks);
  return { ok: true, picks, completed: isComplete(picks) !== isComplete(before) };
}

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

/** The viewer's picker for the requested session, or why there is nothing to pick. */
export async function predictPicker(
  repo: MotorsportRepo,
  { userId, now }: Viewer,
  { series, eventId, sessionId }: PickerRef,
  fetchFn: FetchFn,
): Promise<SchedulePayload | string> {
  const event = groupEvents(repo.sessions.list(series)).find((e) => e.eventId === eventId);
  const open = event ? openPredictions(event, now) : [];
  const session = open.find((s) => s.sessionId === sessionId) ?? open[0];
  if (!event || !session) return "No races or sprints left to predict this weekend.";
  const grid = await predictionGrid(repo, series, now, fetchFn);
  if (grid.length === 0) {
    return "No driver list yet: predictions open once the first session's results are in.";
  }
  return renderPredictPicker({
    info: seriesInfo(series),
    eventName: event.eventName,
    session,
    grid,
    picks: repo.predictions.get(userId, series, eventId, session.sessionId),
    others: open.filter((s) => s !== session),
  });
}

/** The public season table: predictions scored against results posted this (UTC) year. */
export function seasonLeaderboard(repo: MotorsportRepo, series: SeriesKey, now: number): string {
  const year = new Date(now).getUTCFullYear();
  const entries = repo.predictions.season(series, Date.UTC(year, 0, 1));
  return renderLeaderboard(seriesInfo(series), year, leaderboard(entries));
}
