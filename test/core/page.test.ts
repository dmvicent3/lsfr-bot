import { expect, test } from "bun:test";
import { excerpt } from "../../src/core/excerpt.ts";
import { pageText, readPage } from "../../src/core/page.ts";
import type { FetchFn } from "../../src/core/types.ts";

const HTML = `<html><head><title>x</title><style>p{}</style></head><body>
<script>var a = "<p>no</p>";</script><nav>Home</nav>
<h1>FP1 results</h1><p>Mexico &amp; more&nbsp;news &#8211; today</p>
<table><tr><th>Pos</th><th>Driver</th></tr><tr><td>1</td><td>Lando  Norris</td></tr></table>
</body></html>`;

test("a page becomes plain lines: no scripts or styles, table rows as cells, entities decoded", () => {
  expect(pageText(HTML)).toBe(
    "Home\nFP1 results\nMexico & more news – today\nPos | Driver\n1 | Lando Norris",
  );
});

const LINES = Array.from({ length: 200 }, (_, i) => `filler line ${i} about nothing much`);
LINES[150] = "FP1 classification: 1 Norris 2 Piastri 3 Verstappen";
const TEXT = LINES.join("\n");

test("JSON left in a page's text is dropped", () => {
  expect(pageText('<p>UK</p><p>"},"image_flag":{"wt":"Flag.svg"}</p>')).toBe("UK");
});

test("the excerpt is the window around the lines that match the query, capped", () => {
  const out = excerpt(TEXT, "fp1 results norris", 500);
  expect(out.text).toContain("FP1 classification: 1 Norris");
  expect(out.text.length).toBeLessThanOrEqual(500);
  expect(out.text).not.toContain("filler line 0 ");
  expect(out.score).toBeGreaterThan(0);
});

test("a page that never mentions the query gives no excerpt", () => {
  expect(excerpt(TEXT, "weather lisbon", 500)).toEqual({ text: "", score: 0 });
});

test("filler words in the question don't count as matches", () => {
  const text = ["the season for the drivers", ...LINES.slice(0, 50), "FP1 Norris"].join("\n");
  expect(excerpt(text, "give me the fp1 for norris", 200).text).toContain("FP1 Norris");
});

test("of two equally good matches, the one with a table after it wins", () => {
  const text = [
    "Free practice 1 news",
    ...LINES.slice(0, 40),
    "Free practice 1 results",
    "# | Driver | Time",
    "1 | Leclerc | 1:17.2",
  ].join("\n");
  expect(excerpt(text, "free practice 1", 200).text).toStartWith("filler line 37");
});

const serving =
  (status: number, body: string, type = "text/html; charset=utf-8"): FetchFn =>
  async () =>
    new Response(body, { status, headers: { "content-type": type } });

test("reads an HTML page as text", async () => {
  expect(await readPage("https://x/fp1", serving(200, "<p>FP1</p><p>Norris</p>"))).toBe(
    "FP1\nNorris",
  );
});

test("a refusal or something that isn't HTML throws", async () => {
  expect(readPage("https://x/a", serving(403, "no"))).rejects.toThrow("403");
  expect(readPage("https://x/a", serving(200, "%PDF", "application/pdf"))).rejects.toThrow("pdf");
});

test("only the first megabyte is read", async () => {
  const body = `<p>${"a".repeat(1_100_000)}</p><p>TAIL</p>`;
  expect(await readPage("https://x/a", serving(200, body))).not.toContain("TAIL");
});

test("a match with a results table under it beats a wordier sentence without one", () => {
  const text = [
    "Check the latest F1 results on all races, qualification and free practices",
    ...LINES.slice(0, 40),
    "Full results from FP1",
    "Pos | Driver | Best",
    "1 | Leclerc | 1:18.128",
    "2 | Antonelli | 1:18.787",
  ].join("\n");
  expect(excerpt(text, "give me the latest free practice results of f1", 300).text).toContain(
    "1 | Leclerc",
  );
});

test("stacked accent noise is cut; a single accent stays", () => {
  expect(pageText("<p>Four Tet - t̸̢̛̼ext café</p>")).toBe("Four Tet - text café");
});
