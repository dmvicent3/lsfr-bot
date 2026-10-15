import type { FetchFn } from "../../core/guards.ts";
import { log } from "../../core/log.ts";
import type { MotorsportRepo } from "./repo.ts";
import { renderResults, resultKind, resultSeries, resultsDue } from "./results.ts";
import { seriesInfo } from "./series.ts";
import { fetchResult } from "./sources/results-fetch.ts";
import type { SeriesKey } from "./types.ts";

/**
 * Looks for the results of sessions that ended recently, posts each once and stores it.
 * Anything that fails (fetch or post) is left unstored, so the next run tries again.
 */
export async function collectResults(
  repo: MotorsportRepo,
  now: number,
  fetchFn: FetchFn,
  post: (series: SeriesKey, text: string) => Promise<void>,
): Promise<void> {
  for (const series of resultSeries()) {
    const sessions = repo.listSessions(series);
    for (const session of resultsDue(sessions, repo.resultKeys(series), now)) {
      const kind = resultKind(series, session.sessionId);
      if (kind === null) continue;
      const race =
        sessions.find((s) => s.eventId === session.eventId && s.sessionId === "race") ?? session;
      try {
        const result = await fetchResult(session, race, fetchFn);
        if (result === null) continue;
        await post(series, renderResults(seriesInfo(series), session.eventName, kind, result));
        repo.insertResult({
          series,
          eventId: session.eventId,
          eventName: session.eventName,
          sessionId: session.sessionId,
          kind,
          rows: result.rows,
          postedAt: now,
        });
      } catch (err) {
        log.error("motorsport:results", `${series} ${session.eventId}/${session.sessionId}`, err);
      }
    }
  }
}
