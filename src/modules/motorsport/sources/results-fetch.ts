import type { FetchFn } from "../../../core/guards.ts";
import { resultKind, type SessionResult } from "../results.ts";
import type { Session } from "../types.ts";
import { getJson } from "./fetch.ts";
import {
  MOTOGP_RESULTS,
  motogpCategoryId,
  motogpEventId,
  motogpQ1SessionId,
  motogpSeasonId,
  motogpSessionId,
  parseMotogp,
} from "./motogp-results.ts";
import { OPENF1, openf1SessionKey, parseOpenF1 } from "./openf1.ts";

/** OpenF1 answers 401 to free users while any session is live: not out yet, try later. */
const OPENF1_NOT_YET = [401, 404];

const day = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * The classification of `session`, or null when it isn't published yet (or the series has no
 * results source). `race` is the event's race, which locates the MotoGP event. Throws on
 * fetch errors so the caller retries.
 */
export async function fetchResult(
  session: Session,
  race: Session,
  fetchFn: FetchFn = fetch,
): Promise<SessionResult | null> {
  const kind = resultKind(session.series, session.sessionId);
  if (kind === null) return null;
  const year = race.start.getUTCFullYear();

  if (session.series === "f1") {
    const openf1 = (path: string): Promise<unknown> =>
      getJson(`${OPENF1}${path}`, fetchFn, OPENF1_NOT_YET);
    const sessions = await openf1(`/sessions?year=${year}`);
    if (sessions === null) return null;
    const key = openf1SessionKey(sessions, kind, session.start);
    if (key === null) return null;
    const results = await openf1(`/session_result?session_key=${key}`);
    if (results === null) return null;
    const drivers = await openf1(`/drivers?session_key=${key}`);
    if (drivers === null) return null;
    return parseOpenF1(kind, results, drivers);
  }

  const api = `${MOTOGP_RESULTS}/v1/results`;
  const seasonId = motogpSeasonId(await getJson(`${api}/seasons`, fetchFn), year);
  if (seasonId === null) return null;
  const events = await getJson(`${api}/events?seasonUuid=${seasonId}`, fetchFn);
  const eventId = motogpEventId(events, day(race.start));
  if (eventId === null) return null;
  const categoryId = motogpCategoryId(
    await getJson(`${api}/categories?eventUuid=${eventId}`, fetchFn),
  );
  if (categoryId === null) return null;
  const sessions = await getJson(
    `${api}/sessions?eventUuid=${eventId}&categoryUuid=${categoryId}`,
    fetchFn,
  );
  const sessionId = motogpSessionId(sessions, kind);
  if (sessionId === null) return null;
  const classification = (id: string): Promise<unknown> =>
    getJson(`${MOTOGP_RESULTS}/v2/results/classifications?session=${id}&test=false`, fetchFn);
  const q1Id = kind === "qualifying" ? motogpQ1SessionId(sessions) : null;
  return parseMotogp(
    kind,
    await classification(sessionId),
    q1Id === null ? undefined : await classification(q1Id),
  );
}
