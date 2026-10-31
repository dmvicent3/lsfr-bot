import { expect, test } from "bun:test";
import { searchText, webSearch } from "../../src/core/search.ts";
import type { FetchFn } from "../../src/core/types.ts";

const answering =
  (status: number, body: string, seen: { url?: string } = {}): FetchFn =>
  async (url) => {
    seen.url = url;

    return new Response(body, { status });
  };

const RESULTS = Array.from({ length: 7 }, (_, i) => ({
  title: `Result ${i}`,
  url: `https://example.com/${i}`,
  content: i === 0 ? "x".repeat(400) : `snippet ${i}`,
}));

test("asks SearXNG for JSON and keeps the top 5, snippets cut to 300", async () => {
  const seen: { url?: string } = {};
  const fetchFn = answering(200, JSON.stringify({ results: RESULTS }), seen);
  const results = await webSearch("http://search:8080", "f1 result & more", fetchFn);
  expect(seen.url).toBe("http://search:8080/search?q=f1+result+%26+more&format=json");
  expect(results).toHaveLength(5);
  expect(results[0]?.snippet).toHaveLength(300);
  expect(results[1]).toEqual({
    title: "Result 1",
    url: "https://example.com/1",
    snippet: "snippet 1",
  });
});

test("a refusal or an HTML page throws", async () => {
  expect(webSearch("http://s", "q", answering(429, "Too Many Requests"))).rejects.toThrow("429");
  expect(webSearch("http://s", "q", answering(200, "<html>nope</html>"))).rejects.toThrow();
});

test("results become numbered lines for the model; none says so", () => {
  expect(
    searchText([
      { title: "A", url: "https://a", snippet: "aa" },
      { title: "B", url: "https://b", snippet: "" },
    ]),
  ).toBe("1. A — https://a\naa\n2. B — https://b");
  expect(searchText([])).toBe("No results.");
});
