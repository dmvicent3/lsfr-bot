import type { Championship, Standings } from "./types.ts";
import { asText, isString, records } from "../../../core/guards.ts";
import type { FetchFn } from "../../../core/types.ts";
import type { SeriesKey } from "../types.ts";
import { getJson } from "../schedule/sources/fetch.ts";
import { MOTOGP_RESULTS, motogpCategoryId, motogpSeasonId } from "../results/motogp-results.ts";
import { parseJolpicaStandings, parseMotogpStandings } from "./parse.ts";

type StandingsFetcher = (
  champ: Championship,
  now: Date,
  fetchFn: FetchFn,
) => Promise<Standings | null>;

const JOLPICA = "https://api.jolpi.ca/ergast/f1/current";

const day = (d: Date): string => d.toISOString().slice(0, 10);

async function fetchF1(
  champ: Championship,
  _now: Date,
  fetchFn: FetchFn,
): Promise<Standings | null> {
  const path = champ === "drivers" ? "driverStandings" : "constructorStandings";
  return parseJolpicaStandings(champ, await getJson(`${JOLPICA}/${path}.json?limit=100`, fetchFn));
}

/** MotoGP has riders' standings only. */
async function fetchMotogp(
  champ: Championship,
  now: Date,
  fetchFn: FetchFn,
): Promise<Standings | null> {
  if (champ !== "drivers") return null;
  const api = `${MOTOGP_RESULTS}/v1/results`;
  const seasonId = motogpSeasonId(await getJson(`${api}/seasons`, fetchFn), now.getUTCFullYear());
  if (seasonId === null) return null;
  // Categories hang off an event; any finished race weekend of the season will do.
  const events = records(await getJson(`${api}/events?seasonUuid=${seasonId}`, fetchFn))
    .filter((e) => e["test"] !== true && isString(e["date_end"]) && e["date_end"] <= day(now))
    .toSorted((a, b) => asText(b["date_end"]).localeCompare(asText(a["date_end"])));
  const eventId = events[0]?.["id"];
  if (!isString(eventId)) return null;
  const categoryId = motogpCategoryId(
    await getJson(`${api}/categories?eventUuid=${eventId}`, fetchFn),
  );
  if (categoryId === null) return null;
  return parseMotogpStandings(
    await getJson(`${api}/standings?seasonUuid=${seasonId}&categoryUuid=${categoryId}`, fetchFn),
  );
}

const FETCHERS: Partial<Record<SeriesKey, StandingsFetcher>> = { f1: fetchF1, motogp: fetchMotogp };

/** The series with standings sources: F1 (drivers + constructors), MotoGP (riders). */
export const STANDINGS_SERIES: readonly SeriesKey[] = ["f1", "motogp"];

/**
 * Current standings, fetched live; null when the series or championship has no source (or
 * nothing is published). Throws on fetch errors.
 */
export async function fetchStandings(
  series: SeriesKey,
  champ: Championship,
  now: Date,
  fetchFn: FetchFn = fetch,
): Promise<Standings | null> {
  const fetcher = FETCHERS[series];
  return fetcher ? fetcher(champ, now, fetchFn) : null;
}
