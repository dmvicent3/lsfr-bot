import { expect, test } from "bun:test";
import { JevError } from "../../../src/core/jev/http.ts";
import type { Jev } from "../../../src/core/jev/types.ts";
import type { Excerpt } from "../../../src/core/excerpt.ts";
import { pickPages } from "../../../src/modules/chat/page-step.ts";
import type { SearchResult } from "../../../src/core/search.ts";
import type { Turn } from "../../../src/core/types.ts";
import {
  needsSearch,
  replyFor,
  sourcesLine,
  withoutSources,
  withResults,
} from "../../../src/modules/chat/search-step.ts";

const jevSaying = (p: number): Jev => ({ yesNo: async () => new Map([["web", p]]) });

const RESULTS: SearchResult[] = [1, 2, 3, 4].map((i) => ({
  title: `T${i}`,
  url: `https://x/${i}`,
  snippet: `s${i}`,
}));

const TURNS: Turn[] = [{ role: "user", text: "daniel: who is the UK PM?" }];

test("jev decides whether a message needs the web; a jev failure means no", async () => {
  expect(await needsSearch(jevSaying(0.88), "fp1 results")).toBe(true);
  expect(await needsSearch(jevSaying(0.3), "a joke")).toBe(false);
  const down: Jev = {
    yesNo: async () => {
      throw new JevError("paused");
    },
  };
  expect(await needsSearch(down, "fp1 results")).toBe(false);
});

test("results go into the last user turn, dated", () => {
  const out = withResults(
    TURNS,
    { query: "who is the UK PM?", results: RESULTS.slice(0, 1), page: null },
    "2026-10-31",
  );
  expect(out).toEqual([
    {
      role: "user",
      text: 'daniel: who is the UK PM?\n\nWeb search results for "who is the UK PM?" (searched 2026-10-31):\n1. T1 — https://x/1\ns1\n\nAnswer from these results. Don\'t list links; they are added for you.',
    },
  ]);
});

test("a page's text goes under the results, named by its link", () => {
  const out = withResults(
    TURNS,
    { query: "q", results: RESULTS.slice(0, 1), page: { url: "https://x/1", text: "1 | Norris" } },
    "2026-10-31",
  );
  expect(out[0]?.text).toContain(
    "s1\n\nText from https://x/1:\n1 | Norris\n\nAnswer from these results.",
  );
});

const at = (url: string): SearchResult => ({ title: "", url, snippet: "" });

test("the pages read are the first two web results that aren't a site's front page", () => {
  const front = at("https://www.formula1.com/");
  const pages = [at("https://rn365.com/fp1"), at("https://f1.com/fp1"), at("https://x.com/fp1")];
  expect(pickPages([front, at("ftp://x/a"), ...pages])).toEqual(pages.slice(0, 2));
  expect(pickPages([at("https://www.formula1.com"), at("not a url")])).toEqual([]);
});

test("sources are the top three links, unembedded; none without results", () => {
  expect(sourcesLine(RESULTS)).toBe("\n\nSources: <https://x/1> <https://x/2> <https://x/3>");
  expect(sourcesLine([])).toBe("");
});

/** Fake deps that record what the model was asked. */
function deps(o: { search: boolean; results: SearchResult[]; pages?: Record<string, Excerpt> }) {
  const asked: Turn[][] = [];
  const searched: string[] = [];
  const read: string[] = [];

  return {
    asked,
    searched,
    read,
    d: {
      decide: async () => o.search,
      search: async (q: string) => {
        searched.push(q);

        return o.results;
      },
      read: async (url: string, query: string) => {
        read.push(`${url} ${query}`);

        return o.pages?.[url] ?? { text: "", score: 0 };
      },
      ask: async (turns: Turn[]) => {
        asked.push(turns);

        return "answer";
      },
      today: "2026-10-31",
    },
  };
}

test("no search needed: the plain conversation, no sources", async () => {
  const f = deps({ search: false, results: RESULTS });
  expect(await replyFor(f.d, TURNS, "a joke")).toBe("answer");
  expect(f.searched).toEqual([]);
  expect(f.asked[0]).toEqual(TURNS);
});

test("a search with results: the model reads them, the reply lists sources", async () => {
  const f = deps({ search: true, results: RESULTS });
  expect(await replyFor(f.d, TURNS, "who is the UK PM?")).toBe(
    "answer\n\nSources: <https://x/1> <https://x/2> <https://x/3>",
  );
  expect(f.searched).toEqual(["who is the UK PM?"]);
  expect(f.asked[0]?.[0]?.text).toContain("Web search results");
});

test("a search with nothing back, or no text to search, answers plainly", async () => {
  const empty = deps({ search: true, results: [] });
  expect(await replyFor(empty.d, TURNS, "q")).toBe("answer");
  expect(empty.asked[0]).toEqual(TURNS);
  const imageOnly = deps({ search: true, results: RESULTS });
  await replyFor(imageOnly.d, TURNS, "  ");
  expect(imageOnly.searched).toEqual([]);
});

test("an earlier Sources line is cut from Gork's own text", () => {
  expect(withoutSources(`Russell was fastest.${sourcesLine(RESULTS)}`)).toBe(
    "Russell was fastest.",
  );
  expect(withoutSources("No links here.")).toBe("No links here.");
});

test("a search reads two pages; the one that matches best reaches the model", async () => {
  const pages = {
    "https://x/1": { text: "FP1 news", score: 10 },
    "https://x/2": { text: "1 | Norris", score: 22 },
  };
  const f = deps({ search: true, results: RESULTS, pages });
  await replyFor(f.d, TURNS, "fp1");
  expect(f.read.toSorted()).toEqual(["https://x/1 fp1", "https://x/2 fp1"]);
  expect(f.asked[0]?.[0]?.text).toContain("Text from https://x/2:\n1 | Norris");
  expect(f.asked[0]?.[0]?.text).not.toContain("FP1 news");
});

test("a page with nothing useful leaves the snippets alone", async () => {
  const f = deps({ search: true, results: RESULTS });
  await replyFor(f.d, TURNS, "fp1");
  expect(f.asked[0]?.[0]?.text).not.toContain("Text from");
});
