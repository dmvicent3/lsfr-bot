import { generate } from "../../core/llm.ts";
import { log } from "../../core/log.ts";
import { excerpt, readPage } from "../../core/page.ts";
import { type SearchResult, webSearch } from "../../core/search.ts";
import type { Turn } from "../../core/types.ts";
import { PERSONALITY } from "./personality.ts";
import { needsSearch, replyFor } from "./search-step.ts";
import { endOnUser } from "./text.ts";
import type { ChatOptions } from "./types.ts";

/** One reply's whole budget: jev, a search and the answer, queued behind other requests. */
const REPLY_BUDGET_MS = 180_000;

/** Results for a query; a failure is logged and reads as none. */
async function searchFor(url: string, query: string): Promise<SearchResult[]> {
  try {
    return await webSearch(url, query);
  } catch (err) {
    log.error("chat:search", `search for "${query}" failed`, err);

    return [];
  }
}

/** The part of a page about the query; a page that can't be read (blocked, not HTML) gives "". */
async function readFor(url: string, query: string): Promise<string> {
  try {
    return excerpt(await readPage(url), query);
  } catch (err) {
    log.info("chat:page", `couldn't read ${url}: ${err instanceof Error ? err.message : "?"}`);

    return "";
  }
}

/**
 * Gork's answer to the conversation. `query` is the newest message's own text: when jev says it
 * needs the web (and both jev and SearXNG are set), it is searched and the results read first.
 */
export function askModel(o: ChatOptions, turns: Turn[], query: string): Promise<string> {
  const signal = AbortSignal.timeout(REPLY_BUDGET_MS);
  const today = new Date().toISOString().slice(0, 10);
  const system = `${PERSONALITY}\nToday is ${today}.`;
  const { jev, searchUrl } = o;

  return replyFor(
    {
      decide: async (q) => (jev && searchUrl ? needsSearch(jev, q) : false),
      search: async (q) => (searchUrl ? searchFor(searchUrl, q) : []),
      read: readFor,
      ask: async (t) => generate(t, { url: o.llmUrl, system, signal }),
      today,
    },
    endOnUser(turns),
    query,
  );
}
