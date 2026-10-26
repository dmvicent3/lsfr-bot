import type { FetchFn } from "../../../core/types.ts";
import { getJson } from "../schedule/sources/fetch.ts";
import type { SeriesKey, Session } from "../types.ts";
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
import { resultKind } from "./results.ts";
import type { Fetcher, MotogpEvent, SessionResult } from "./types.ts";

/** OpenF1 answers 401 to free users while any session is live: not out yet, try later. */
const OPENF1_NOT_YET = [401, 404];
const MOTOGP_API = `${MOTOGP_RESULTS}/v1/results`;

const day = (d: Date): string => d.toISOString().slice(0, 10);

/** OpenF1: the session by kind and start time, then its result and driver names. */
const fetchOpenF1: Fetcher = async ({ session, race, kind }, fetchFn) => {
  const openf1 = (path: string): Promise<unknown> =>
    getJson(`${OPENF1}${path}`, fetchFn, OPENF1_NOT_YET);
  const sessions = await openf1(`/sessions?year=${race.start.getUTCFullYear()}`);
  const key = sessions === null ? null : openf1SessionKey(sessions, kind, session.start);

  if (key === null) return null;

  const results = await openf1(`/session_result?session_key=${key}`);
  const drivers = results === null ? null : await openf1(`/drivers?session_key=${key}`);

  return drivers === null ? null : parseOpenF1(kind, results, drivers);
};

/** MotoGP's event and MotoGP-class category ids for the race weekend. */
async function motogpEvent(race: Session, fetchFn: FetchFn): Promise<MotogpEvent | null> {
  const seasons = await getJson(`${MOTOGP_API}/seasons`, fetchFn);
  const seasonId = motogpSeasonId(seasons, race.start.getUTCFullYear());

  if (seasonId === null) return null;

  const events = await getJson(`${MOTOGP_API}/events?seasonUuid=${seasonId}`, fetchFn);
  const eventId = motogpEventId(events, day(race.start));

  if (eventId === null) return null;

  const categories = await getJson(`${MOTOGP_API}/categories?eventUuid=${eventId}`, fetchFn);
  const categoryId = motogpCategoryId(categories);

  return categoryId === null ? null : { eventId, categoryId };
}

/** MotoGP: season → event → category → session, then its classification (plus Q1's for qualifying). */
const fetchMotogp: Fetcher = async ({ race, kind }, fetchFn) => {
  const event = await motogpEvent(race, fetchFn);

  if (!event) return null;

  const query = `eventUuid=${event.eventId}&categoryUuid=${event.categoryId}`;
  const sessions = await getJson(`${MOTOGP_API}/sessions?${query}`, fetchFn);
  const sessionId = motogpSessionId(sessions, kind);

  if (sessionId === null) return null;

  const classification = (id: string): Promise<unknown> =>
    getJson(`${MOTOGP_RESULTS}/v2/results/classifications?session=${id}&test=false`, fetchFn);
  const q1Id = kind === "qualifying" ? motogpQ1SessionId(sessions) : null;
  const q1 = q1Id === null ? undefined : await classification(q1Id);

  return parseMotogp(kind, await classification(sessionId), q1);
};

const FETCHERS: Partial<Record<SeriesKey, Fetcher>> = { f1: fetchOpenF1, motogp: fetchMotogp };

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
  const fetcher = FETCHERS[session.series];

  if (kind === null || !fetcher) return null;

  return fetcher({ session, race, kind }, fetchFn);
}
