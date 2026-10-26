import type { FetchFn } from "../../../core/types.ts";
import { log } from "../../../core/log.ts";
import type { CollectDeps, SessionResult } from "./types.ts";
import type { Post } from "../types.ts";
import { renderPredictionResults } from "../predictions/scoring.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { StoredResult } from "../types.ts";
import { renderResults, resultKind, resultSeries, resultsDue } from "./results.ts";
import { seriesInfo } from "../series.ts";
import { fetchResult } from "./results-fetch.ts";
import type { SeriesKey, Session } from "../types.ts";

/**
 * Looks for the results of sessions that ended recently, posts each once and stores it.
 * Anything that fails (fetch or post) is left unstored, so the next run tries again. Results
 * go in the weekend thread; the (short) predictions block stays in the channel.
 */
export async function collectResults(
  repo: MotorsportRepo,
  now: number,
  fetchFn: FetchFn,
  post: Post,
): Promise<void> {
  const deps = { repo, now, fetchFn, post };

  for (const series of resultSeries()) {
    const sessions = repo.sessions.list(series);

    for (const session of resultsDue(sessions, repo.results.keys(series), now)) {
      await collectOne(deps, session, raceOf(sessions, session));
    }
  }
}

async function collectOne(deps: CollectDeps, session: Session, race: Session): Promise<void> {
  try {
    await postResult(deps, session, race);
  } catch (err) {
    const { series, eventId, sessionId } = session;
    log.error("motorsport:results", `${series} ${eventId}/${sessionId}`, err);
  }
}

async function postResult(deps: CollectDeps, session: Session, race: Session): Promise<void> {
  const { repo, now, fetchFn, post } = deps;
  const { series, eventId, eventName, sessionId } = session;
  const kind = resultKind(series, sessionId);

  if (kind === null) return;

  const result = await fetchResult(session, race, fetchFn);

  if (result === null) return;

  const heading = { info: seriesInfo(series), eventName, kind };
  await post(
    { series, eventId, eventName, place: "thread" },
    { content: renderResults(heading, result) },
  );
  repo.results.insert({
    series,
    eventId,
    eventName,
    sessionId,
    kind,
    rows: result.rows,
    postedAt: now,
  });
  // After storing: a failure here must not re-post the results.
  await postPredictions(deps, session, result);
}

async function postPredictions(
  { repo, post }: CollectDeps,
  { series, eventId, eventName, sessionId }: Session,
  result: SessionResult,
): Promise<void> {
  const predictions = repo.predictions.complete(series, eventId, sessionId);

  if (predictions.length === 0) return;

  await post(
    { series, eventId, eventName, place: "channel" },
    { content: renderPredictionResults(predictions, result.rows) },
  );
}

function raceOf(sessions: Session[], session: Session): Session {
  return sessions.find((s) => s.eventId === session.eventId && s.sessionId === "race") ?? session;
}

/** How many recent sessions `/motorsport results` tries before giving up. */
const LOOKBACK = 3;

/**
 * The newest finished result session's classification: the stored one when it is that
 * session, otherwise fetched live (not stored, so the job still posts it). Falls back to
 * older sessions while the newest isn't published yet.
 */
export async function latestResult(
  repo: MotorsportRepo,
  series: SeriesKey,
  now: number,
  fetchFn: FetchFn,
): Promise<Pick<StoredResult, "eventName" | "kind" | "rows"> | null> {
  const sessions = repo.sessions.list(series);
  const stored = repo.results.latest(series);
  const finished = sessions
    .filter((s) => resultKind(series, s.sessionId) !== null && s.end.getTime() <= now)
    .toSorted((a, b) => b.end.getTime() - a.end.getTime())
    .slice(0, LOOKBACK);

  for (const session of finished) {
    if (stored?.eventId === session.eventId && stored.sessionId === session.sessionId) {
      return stored;
    }

    const kind = resultKind(series, session.sessionId);
    const result = kind && (await fetchResult(session, raceOf(sessions, session), fetchFn));

    if (kind && result) return { eventName: session.eventName, kind, rows: result.rows };
  }

  return stored;
}
