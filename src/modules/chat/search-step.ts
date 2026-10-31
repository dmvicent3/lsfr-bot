import { JevError } from "../../core/jev/http.ts";
import type { Jev } from "../../core/jev/types.ts";
import { type SearchResult, searchText } from "../../core/search.ts";
import type { Turn } from "../../core/types.ts";
import { bestPage, type Page, type ReadPage } from "./page-step.ts";

/**
 * Probed 2026-10-31 on live jev: 20/20 at 0.5 (PM, president, champion, CEO without "now", fp1,
 * last race, weather, prices, news, next race vs jokes, code, maths, history, greetings). The
 * wording before it missed "who is the uk pm?" (0.31) and "president of france" (0.24).
 */
const NEEDS_WEB =
  "Does answering this message need current or recent information from the web (news, live or recent sports results, scores, standings, prices, weather, releases, schedules, or who holds a job or title today, such as a prime minister, president, CEO or champion, even when the message does not say now)?";

const THRESHOLD = 0.5;

const SOURCES = 3;

/** How to answer from results: short and plain (Discord shows markdown tables as raw pipes). */
export const ANSWER_RULES =
  'Answer from these results, in a sentence or two. Only when the question asks for session or race results, standings or a ranking, give the top 5 as plain lines like "1. Name (Team) time"; no tables. Don\'t list links; they are added for you.';

/** Said when a search was needed but found nothing usable, so the model doesn't guess. */
export const NOTHING_FOUND =
  "(A web search for this found nothing useful. If the answer depends on recent or current information, say you couldn't check it rather than guessing.)";

/** The conversation with a note added to its last user turn (the model reads it best there). */
function appendToLast(turns: Turn[], note: string): Turn[] {
  const last = turns.at(-1);

  if (!last) return turns;

  return [...turns.slice(0, -1), { ...last, text: `${last.text}\n\n${note}` }];
}

/**
 * Whether a message needs a web search; jev decides, since the 2B chat model neither calls its
 * search tool reliably nor picks queries (probed). A jev failure means no search.
 */
export async function needsSearch(jev: Jev, text: string): Promise<boolean> {
  try {
    const answers = await jev.yesNo(`Chat message: ${text}`, [
      { key: "web", instructions: NEEDS_WEB },
    ]);

    return (answers.get("web") ?? 0) >= THRESHOLD;
  } catch (err) {
    if (err instanceof JevError) return false;

    throw err;
  }
}

/** What a search found: the results and the excerpt of one page read, if any. */
export interface Found {
  query: string;
  results: SearchResult[];
  page: Page | null;
}

/** The conversation with what was found appended to its last user turn. */
export function withResults(turns: Turn[], found: Found, today: string): Turn[] {
  const { query, results, page } = found;
  const read = page ? `\n\nText from ${page.url}:\n${page.text}` : "";

  return appendToLast(
    turns,
    `Web search results for "${query}" (searched ${today}):\n${searchText(results)}${read}\n\n${ANSWER_RULES}`,
  );
}

/** The top links, in angle brackets so Discord doesn't embed them. */
export const sourcesLine = (results: SearchResult[]): string =>
  results.length === 0
    ? ""
    : `\n\nSources: ${results
        .slice(0, SOURCES)
        .map((r) => `<${r.url}>`)
        .join(" ")}`;

/** Gork's earlier text without its Sources line, so the model never sees itself writing links. */
export const withoutSources = (text: string): string => text.replace(/\n\nSources: <[^\n]*$/, "");

export interface ReplyDeps {
  decide: (query: string) => Promise<boolean>;
  /** Results for a query; [] on failure. */
  search: (query: string) => Promise<SearchResult[]>;
  /** The part of a page about the query; empty when it can't be read or says nothing about it. */
  read: ReadPage;
  ask: (turns: Turn[]) => Promise<string>;
  today: string;
}

/** Gork's reply: searched first when the message needs the web; told so when nothing came back. */
export async function replyFor(d: ReplyDeps, turns: Turn[], query: string): Promise<string> {
  const q = query.trim();

  if (!q || !(await d.decide(q))) return d.ask(turns);

  const results = await d.search(q);

  if (results.length === 0) return d.ask(appendToLast(turns, NOTHING_FOUND));

  const page = await bestPage(d.read, results, q);
  const answer = await d.ask(withResults(turns, { query: q, results, page }, d.today));

  return answer + sourcesLine(results);
}
