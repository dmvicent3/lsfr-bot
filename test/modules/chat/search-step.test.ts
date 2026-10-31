import { expect, test } from "bun:test";
import { JevError } from "../../../src/core/jev/http.ts";
import type { Jev } from "../../../src/core/jev/types.ts";
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
  const out = withResults(TURNS, "who is the UK PM?", RESULTS.slice(0, 1), "2026-10-31");
  expect(out).toEqual([
    {
      role: "user",
      text: 'daniel: who is the UK PM?\n\nWeb search results for "who is the UK PM?" (searched 2026-10-31):\n1. T1 — https://x/1\ns1\n\nAnswer from these results. Don\'t list links; they are added for you.',
    },
  ]);
});

test("sources are the top three links, unembedded; none without results", () => {
  expect(sourcesLine(RESULTS)).toBe("\n\nSources: <https://x/1> <https://x/2> <https://x/3>");
  expect(sourcesLine([])).toBe("");
});

/** Fake deps that record what the model was asked. */
function deps(o: { search: boolean; results: SearchResult[] }) {
  const asked: Turn[][] = [];
  const searched: string[] = [];

  return {
    asked,
    searched,
    d: {
      decide: async () => o.search,
      search: async (q: string) => {
        searched.push(q);

        return o.results;
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
