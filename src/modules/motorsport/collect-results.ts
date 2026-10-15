import type { FetchFn } from "../../core/guards.ts";
import { log } from "../../core/log.ts";
import type { Post } from "./post.ts";
import { renderPredictionResults } from "./predictions.ts";
import type { MotorsportRepo, StoredResult } from "./repo.ts";
import { renderResults, resultKind, resultSeries, resultsDue } from "./results.ts";
import { seriesInfo } from "./series.ts";
import { fetchResult } from "./sources/results-fetch.ts";
import type { SeriesKey, Session } from "./types.ts";

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
  for (const series of resultSeries()) {
    const sessions = repo.listSessions(series);
    for (const session of resultsDue(sessions, repo.resultKeys(series), now)) {
      const kind = resultKind(series, session.sessionId);
      if (kind === null) continue;
      const race = raceOf(sessions, session);
      const { eventId, eventName } = session;
      try {
        const result = await fetchResult(session, race, fetchFn);
        if (result === null) continue;
        await post(
          { series, eventId, eventName, place: "thread" },
          { content: renderResults(seriesInfo(series), eventName, kind, result) },
        );
        repo.insertResult({
          series,
          eventId: session.eventId,
          eventName: session.eventName,
          sessionId: session.sessionId,
          kind,
          rows: result.rows,
          postedAt: now,
        });
        // After storing: a failure here must not re-post the results.
        const predictions = repo.completePredictions(series, session.eventId, session.sessionId);
        if (predictions.length > 0) {
          await post(
            { series, eventId, eventName, place: "channel" },
            { content: renderPredictionResults(predictions, result.rows) },
          );
        }
      } catch (err) {
        log.error("motorsport:results", `${series} ${session.eventId}/${session.sessionId}`, err);
      }
    }
  }
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
  const sessions = repo.listSessions(series);
  const stored = repo.latestResult(series);
  const finished = sessions
    .filter((s) => resultKind(series, s.sessionId) !== null && s.end.getTime() <= now)
    .toSorted((a, b) => b.end.getTime() - a.end.getTime())
    .slice(0, LOOKBACK);
  for (const session of finished) {
    if (stored?.eventId === session.eventId && stored.sessionId === session.sessionId)
      return stored;
    const kind = resultKind(series, session.sessionId);
    const result = kind && (await fetchResult(session, raceOf(sessions, session), fetchFn));
    if (kind && result) return { eventName: session.eventName, kind, rows: result.rows };
  }
  return stored;
}
