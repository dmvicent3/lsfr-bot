import { JevError } from "../../core/jev/http.ts";
import type { Jev } from "../../core/jev/types.ts";
import { type SearchResult, searchText } from "../../core/search.ts";
import type { Turn } from "../../core/types.ts";

/** Probed 2026-10-31 on live jev: 10/10 at 0.5 (fp1, last race, weather, PM, prices vs jokes, code, maths). */
const NEEDS_WEB =
  "Does answering this message need current or recent information from the web (news, live or recent sports results, scores, standings, prices, weather, releases, schedules, who holds a role now)?";

const THRESHOLD = 0.5;

const SOURCES = 3;

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

/** The conversation with the results appended to its last user turn (the model reads them best there). */
export function withResults(
  turns: Turn[],
  query: string,
  results: SearchResult[],
  today: string,
): Turn[] {
  const last = turns.at(-1);

  if (!last) return turns;

  const block = `Web search results for "${query}" (searched ${today}):\n${searchText(results)}\n\nAnswer from these results. Don't list links; they are added for you.`;

  return [...turns.slice(0, -1), { ...last, text: `${last.text}\n\n${block}` }];
}

/** The top links, in angle brackets so Discord doesn't embed them. */
export const sourcesLine = (results: SearchResult[]): string =>
  results.length === 0
    ? ""
    : `\n\nSources: ${results
        .slice(0, SOURCES)
        .map((r) => `<${r.url}>`)
        .join(" ")}`;

export interface ReplyDeps {
  decide: (query: string) => Promise<boolean>;
  /** Results for a query; [] on failure. */
  search: (query: string) => Promise<SearchResult[]>;
  ask: (turns: Turn[]) => Promise<string>;
  today: string;
}

/** Gork's reply: searched first when the message needs the web and results come back. */
export async function replyFor(d: ReplyDeps, turns: Turn[], query: string): Promise<string> {
  const q = query.trim();
  const results = q && (await d.decide(q)) ? await d.search(q) : [];

  if (results.length === 0) return d.ask(turns);

  const answer = await d.ask(withResults(turns, q, results, d.today));

  return answer + sourcesLine(results);
}
