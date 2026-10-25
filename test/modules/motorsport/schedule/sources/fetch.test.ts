import { describe, expect, test } from "bun:test";
import type { FetchFn } from "../../../../../src/core/types.ts";
import { seriesInfo } from "../../../../../src/modules/motorsport/series.ts";
import { fetchSeries } from "../../../../../src/modules/motorsport/schedule/sources/fetch.ts";
import { fixture } from "../../testing/fixtures.ts";

function respond(status: number, body: unknown, urls: string[] = []): FetchFn {
  return async (url) => {
    urls.push(url);
    return new Response(JSON.stringify(body), { status });
  };
}

describe("fetchSeries", () => {
  test("a 404 means no events", async () => {
    expect(await fetchSeries(seriesInfo("f2"), 2027, respond(404, {}))).toEqual([]);
  });

  test("other errors reject", async () => {
    const err = await fetchSeries(seriesInfo("f2"), 2026, respond(500, {})).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(Error);
  });

  test("parses the series file from its source URL", async () => {
    const urls: string[] = [];
    const sessions = await fetchSeries(
      seriesInfo("f1"),
      2026,
      respond(200, await fixture("tunous-formula1"), urls),
    );
    expect(urls).toEqual([
      "https://raw.githubusercontent.com/Tunous/MotorsportCalendar/main/data/formula1/2026.json",
    ]);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions.every((s) => s.series === "f1")).toBe(true);
  });
});

test("requests time out", async () => {
  let signal: AbortSignal | null | undefined;
  await fetchSeries(seriesInfo("f2"), 2027, async (_url, init) => {
    signal = init?.signal;
    return new Response("", { status: 404 });
  });
  expect(signal).toBeInstanceOf(AbortSignal);
});
