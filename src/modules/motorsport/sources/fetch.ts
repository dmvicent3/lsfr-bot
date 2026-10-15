import type { FetchFn } from "../../../core/guards.ts";
import type { SeriesInfo } from "../series.ts";
import type { ParsedSession } from "../types.ts";
import { parseSportstimes } from "./sportstimes.ts";
import { parseTunous } from "./tunous.ts";

export function sourceUrl(info: SeriesInfo, year: number): string {
  return info.source === "tunous"
    ? `https://raw.githubusercontent.com/Tunous/MotorsportCalendar/main/data/${info.path}/${year}.json`
    : `https://raw.githubusercontent.com/sportstimes/f1/main/_db/${info.path}/${year}.json`;
}

export async function fetchSeries(
  info: SeriesInfo,
  year: number,
  fetchFn: FetchFn = fetch,
): Promise<ParsedSession[]> {
  const url = sourceUrl(info, year);
  const res = await fetchFn(url, { signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  const json: unknown = await res.json();
  return info.source === "tunous"
    ? parseTunous(info.key, year, json)
    : parseSportstimes(info.key, year, json);
}

/** JSON from `url`; null on 404 (nothing there yet). Other failures throw. */
export async function getJson(url: string, fetchFn: FetchFn = fetch): Promise<unknown> {
  const res = await fetchFn(url, { signal: AbortSignal.timeout(30_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}
