import { expect, test } from "bun:test";
import type { FetchFn } from "../../../../src/core/types.ts";
import type { Session } from "../../../../src/modules/motorsport/types.ts";
import { fetchResult } from "../../../../src/modules/motorsport/results/results-fetch.ts";
import { fixture } from "../testing/fixtures.ts";

function session(series: Session["series"], sessionId: string, start: string): Session {
  return {
    series,
    eventId: "e",
    eventName: "E",
    sessionId,
    title: sessionId,
    start: new Date(start),
    end: new Date(Date.parse(start) + 3_600_000),
    pingable: true,
  };
}

/** Serves fixtures for the URL substrings given; everything else is a 404. */
async function fakeFetch(routes: Record<string, string>): Promise<FetchFn & { urls: string[] }> {
  const bodies = new Map<string, string>();

  for (const [part, name] of Object.entries(routes)) {
    bodies.set(part, JSON.stringify(await fixture(name)));
  }

  const urls: string[] = [];

  const fn = async (url: string): Promise<Response> => {
    urls.push(url);

    for (const [part, body] of bodies) if (url.includes(part)) return new Response(body);

    return new Response('{"detail":"No results found."}', { status: 404 });
  };

  return Object.assign(fn, { urls });
}

const f1Routes = {
  "/v1/sessions?year=2026": "openf1-sessions",
  "/v1/drivers?session_key=11388": "openf1-drivers",
  "/v1/session_result?session_key=11388": "openf1-result-race",
};

test("F1 race via OpenF1", async () => {
  const fetchFn = await fakeFetch(f1Routes);
  const race = session("f1", "race", "2026-10-11T12:00:00Z");
  const result = await fetchResult(race, race, fetchFn);
  expect(result?.rows[0]?.name).toBe("Verstappen");
});

test("F1 results not published yet is null", async () => {
  const fetchFn = await fakeFetch({ "/v1/sessions?year=2026": "openf1-sessions" });
  const race = session("f1", "race", "2026-10-11T12:00:00Z");
  expect(await fetchResult(race, race, fetchFn)).toBeNull();
});

test("MotoGP qualifying walks season, event, category and session", async () => {
  const fetchFn = await fakeFetch({
    "/v1/results/seasons": "motogp-seasons",
    "/v1/results/events?seasonUuid=e88b4e43-2209-47aa-8e83-0e0b1cedde6e": "motogp-events",
    "/v1/results/categories?eventUuid=": "motogp-categories",
    "/v1/results/sessions?eventUuid=": "motogp-sessions",
    "/v2/results/classifications?session=": "motogp-Q2",
  });
  const race = session("motogp", "race", "2026-10-11T06:00:00Z");
  const q2 = session("motogp", "qualifying2", "2026-10-10T03:00:00Z");
  const result = await fetchResult(q2, race, fetchFn);
  expect(result?.rows[0]).toEqual({
    pos: "1",
    id: "58448742-f520-466a-a1a1-bf3286cce9c3",
    name: "Fernandez",
    team: "Aprilia",
    time: "1:28.852",
  });
});

const failingFetch: FetchFn = async () => new Response("", { status: 500 });

test("server errors throw so the job retries", async () => {
  const race = session("f1", "race", "2026-10-11T12:00:00Z");
  expect(fetchResult(race, race, failingFetch)).rejects.toThrow("500");
});

test("series without a results source is null", async () => {
  const fetchFn = await fakeFetch({});
  const race = session("wec", "race", "2026-10-11T12:00:00Z");
  expect(await fetchResult(race, race, fetchFn)).toBeNull();
  expect(fetchFn.urls).toEqual([]);
});

const liveLockout: FetchFn = async () => new Response('{"detail":"Live session"}', { status: 401 });

test("F1 during a live session (OpenF1 401) is null, retried quietly", async () => {
  const race = session("f1", "race", "2026-10-11T12:00:00Z");
  expect(await fetchResult(race, race, liveLockout)).toBeNull();
});
