import type { PickOutcome } from "./types.ts";
import type { FetchFn } from "../../../core/types.ts";
import { latestResult } from "../results/collect-results.ts";
import { groupEvents } from "../channels/decisions.ts";
import {
  choosePick,
  isComplete,
  isPredictable,
  leaderboard,
  openPredictions,
  renderLeaderboard,
  renderPredictPicker,
} from "./predictions.ts";
import type { Driver } from "./types.ts";
import type { SchedulePayload } from "../channels/types.ts";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesKey } from "../types.ts";

/**
 * Puts `driverId` at podium position `index` (0 = P1) in the user's prediction, until the
 * session starts. `completed` says whether the prediction now counts and didn't before.
 */
export function savePick(
  repo: MotorsportRepo,
  userId: string,
  series: SeriesKey,
  eventId: string,
  sessionId: string,
  index: number,
  driverId: string,
  now: number,
): PickOutcome {
  const session = repo
    .listSessions(series)
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
  const before = repo.getPicks(userId, series, eventId, sessionId);
  const picks = choosePick(before, index, driverId);
  repo.setPicks(userId, series, eventId, sessionId, picks, now);
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
  const stored = repo.latestResult(series);
  const rows =
    stored && stored.rows.length > 0
      ? stored.rows
      : ((await latestResult(repo, series, now, fetchFn))?.rows ?? []);
  return rows.map(({ id, name }) => ({ id, name }));
}

/**
 * The viewer's picker for `sessionId` (or the event's first open race/sprint), or why
 * there is nothing to pick.
 */
export async function predictPicker(
  repo: MotorsportRepo,
  series: SeriesKey,
  eventId: string,
  sessionId: string | undefined,
  userId: string,
  now: number,
  fetchFn: FetchFn,
): Promise<SchedulePayload | string> {
  const event = groupEvents(repo.listSessions(series)).find((e) => e.eventId === eventId);
  const open = event ? openPredictions(event, now) : [];
  const session = open.find((s) => s.sessionId === sessionId) ?? open[0];
  if (!event || !session) return "No races or sprints left to predict this weekend.";
  const grid = await predictionGrid(repo, series, now, fetchFn);
  if (grid.length === 0) {
    return "No driver list yet: predictions open once the first session's results are in.";
  }
  const picks = repo.getPicks(userId, series, eventId, session.sessionId);
  const others = open.filter((s) => s !== session);
  return renderPredictPicker(seriesInfo(series), event.eventName, session, grid, picks, others);
}

/** The public season table: predictions scored against results posted this (UTC) year. */
export function seasonLeaderboard(repo: MotorsportRepo, series: SeriesKey, now: number): string {
  const year = new Date(now).getUTCFullYear();
  const entries = repo.seasonPredictions(series, Date.UTC(year, 0, 1));
  return renderLeaderboard(seriesInfo(series), year, leaderboard(entries));
}
