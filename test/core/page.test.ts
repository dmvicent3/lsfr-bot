import { expect, test } from "bun:test";
import { excerpt, pageText, readPage } from "../../src/core/page.ts";
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

test("the excerpt is the window around the lines that match the query, capped", () => {
  const out = excerpt(TEXT, "fp1 results norris", 500);
  expect(out).toContain("FP1 classification: 1 Norris");
  expect(out.length).toBeLessThanOrEqual(500);
  expect(out).not.toContain("filler line 0 ");
});

test("a page that never mentions the query gives no excerpt", () => {
  expect(excerpt(TEXT, "weather lisbon", 500)).toBe("");
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
