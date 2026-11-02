import { isRecord } from "../../src/core/guards.ts";

const WB = "https://api.worldbank.org/v2";
const SPARQL = "https://query.wikidata.org/sparql";
const HEADERS = {
  Accept: "application/sparql-results+json",
  "User-Agent": "GorkBot/1.0 (Discord bot data build)",
};
const QUERY = `SELECT ?iso ?elev WHERE {
  ?c wdt:P297 ?iso; wdt:P610 ?peak.
  ?peak wdt:P2044 ?elev.
}`;

async function getJson(fetchFn: typeof fetch, url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetchFn(url, init);

  if (!res.ok) throw new Error(`${url} answered ${res.status}`);

  return res.json();
}

export function fetchWbCountries(fetchFn: typeof fetch): Promise<unknown> {
  return getJson(fetchFn, `${WB}/country?format=json&per_page=400`);
}

/**
 * Every yearly value from 2015 to `lastYear`. Pass the previous calendar year: a range ending
 * in the current year made the API answer with one row per country (the empty latest year).
 */
export function fetchWbIndicator(
  fetchFn: typeof fetch,
  code: string,
  lastYear: number,
): Promise<unknown> {
  const query = `format=json&per_page=20000&date=2015:${lastYear}`;

  return getJson(fetchFn, `${WB}/country/all/indicator/${code}?${query}`);
}

export function fetchWikidata(fetchFn: typeof fetch): Promise<unknown> {
  return getJson(fetchFn, `${SPARQL}?query=${encodeURIComponent(QUERY)}`, {
    headers: HEADERS,
  });
}

const RETRY_MS = 5000;
const MAX_WAIT_MS = 30_000;

/** GET that retries once on 429 and 5xx, for the many small requests the facts build makes. */
export async function getPolite(
  fetchFn: typeof fetch,
  url: string,
  headers: Record<string, string> = HEADERS,
): Promise<Response> {
  let res = await fetchFn(url, { headers, redirect: "follow" });

  if (res.status === 429 || res.status >= 500) {
    const asked = Number(res.headers.get("retry-after")) * 1000;
    const wait = Math.min(asked > 0 ? asked : RETRY_MS, MAX_WAIT_MS);

    await new Promise((resolve) => setTimeout(resolve, wait));
    res = await fetchFn(url, { headers, redirect: "follow" });
  }

  if (!res.ok) throw new Error(`${url} answered ${res.status}`);

  return res;
}

/** Runs each facts query in turn and returns one SPARQL-shaped response holding all their rows. */
export async function fetchFacts(fetchFn: typeof fetch, queries: string[]): Promise<unknown> {
  const bindings: unknown[] = [];

  for (const query of queries) {
    const res = await getPolite(fetchFn, `${SPARQL}?query=${encodeURIComponent(query)}`);
    const body: unknown = await res.json();

    if (isRecord(body) && isRecord(body.results) && Array.isArray(body.results.bindings)) {
      bindings.push(...(body.results.bindings as unknown[]));
    }
  }

  return { results: { bindings } };
}

/** A flag image from Commons, as text; sends only the User-Agent. */
export async function fetchFlagSvg(fetchFn: typeof fetch, url: string): Promise<string> {
  const res = await getPolite(fetchFn, url, { "User-Agent": HEADERS["User-Agent"] });

  return res.text();
}
