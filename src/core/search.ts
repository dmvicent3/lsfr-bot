import { isRecord, isString } from "./guards.ts";
import type { FetchFn } from "./types.ts";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const TOP = 5;
const SNIPPET_CHARS = 300;
const TIMEOUT_MS = 10_000;

const str = (v: unknown): string => (isString(v) ? v : "");

const toResult = (r: unknown): SearchResult[] =>
  isRecord(r) && isString(r["url"])
    ? [
        {
          title: str(r["title"]),
          url: r["url"],
          snippet: str(r["content"]).slice(0, SNIPPET_CHARS),
        },
      ]
    : [];

/** The top results from SearXNG's JSON API; throws on a refusal or a body that isn't JSON. */
export async function webSearch(
  url: string,
  query: string,
  fetchFn: FetchFn = fetch,
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, format: "json" });
  const res = await fetchFn(`${url}/search?${params.toString()}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`search returned ${res.status}`);

  const body: unknown = await res.json();
  const results = isRecord(body) ? body["results"] : null;

  return Array.isArray(results) ? results.flatMap(toResult).slice(0, TOP) : [];
}

/** Results as the tool message the model reads: numbered, link after the title. */
export function searchText(results: SearchResult[]): string {
  if (results.length === 0) return "No results.";

  return results
    .map((r, i) => `${i + 1}. ${r.title} — ${r.url}${r.snippet ? `\n${r.snippet}` : ""}`)
    .join("\n");
}
