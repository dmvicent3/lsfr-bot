import { chat, toMessages } from "../../core/llm.ts";
import { log } from "../../core/log.ts";
import { searchText, webSearch } from "../../core/search.ts";
import type { Turn } from "../../core/types.ts";
import { answerWithSearch } from "./answer.ts";
import { endOnUser } from "./text.ts";
import { PERSONALITY } from "./personality.ts";
import type { ChatOptions } from "./types.ts";

/** One web search as the tool message; a failure is logged and reads as no results. */
async function searchFor(url: string | null, query: string): Promise<string> {
  if (!url) return "No results.";

  try {
    return searchText(await webSearch(url, query));
  } catch (err) {
    log.error("chat:search", `search for "${query}" failed`, err);

    return "No results.";
  }
}

/** One reply's whole budget: up to 3 model calls and 2 searches, queued behind other requests. */
const REPLY_BUDGET_MS = 180_000;

/** Gork's answer to the conversation, searching the web when SearXNG is set and it helps. */
export function askModel(o: ChatOptions, turns: Turn[]): Promise<string> {
  const signal = AbortSignal.timeout(REPLY_BUDGET_MS);

  return answerWithSearch(toMessages(endOnUser(turns), PERSONALITY), {
    ask: async (messages, tools) => chat(messages, { url: o.llmUrl, tools, signal }),
    search: async (query) => searchFor(o.searchUrl, query),
    canSearch: o.searchUrl !== null,
  });
}
