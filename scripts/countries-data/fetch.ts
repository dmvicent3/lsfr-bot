const WB = "https://api.worldbank.org/v2";
const SPARQL = "https://query.wikidata.org/sparql";
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
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "GorkBot/1.0 (Discord bot data build)",
    },
  });
}
