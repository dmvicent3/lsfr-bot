import { describe, expect, test } from "bun:test";
import type { FetchFn } from "../../../../src/core/types.ts";
import { seriesInfo } from "../../../../src/modules/motorsport/series.ts";
import { fixture } from "../testing/fixtures.ts";
import { fetchStandings } from "../../../../src/modules/motorsport/standings/fetch.ts";
import {
  parseJolpicaStandings,
  parseMotogpStandings,
} from "../../../../src/modules/motorsport/standings/parse.ts";
import { renderStandings } from "../../../../src/modules/motorsport/standings/standings.ts";

describe("parseJolpicaStandings", () => {
  test("drivers, with each driver's latest team", async () => {
    const s = parseJolpicaStandings("drivers", await fixture("jolpica-drivers"));
    expect(s?.round).toBe(17);
    expect(s?.rows).toHaveLength(23);
    expect(s?.rows[0]).toEqual({
      pos: "1",
      name: "Antonelli",
      team: "Mercedes",
      points: "340",
      wins: "8",
    });
    expect(s?.rows.find((r) => r.name === "Lawson")?.team).toBe("Red Bull");
    expect(s?.rows.find((r) => r.name === "Pérez")?.team).toBe("Cadillac");
  });

  test("constructors, with short team names", async () => {
    const s = parseJolpicaStandings("constructors", await fixture("jolpica-constructors"));
    expect(s?.rows[0]).toEqual({ pos: "1", name: "Mercedes", team: "", points: "578", wins: "11" });
    expect(s?.rows.map((r) => r.name)).toContain("Racing Bulls");
    expect(s?.rows.map((r) => r.name)).toContain("Alpine");
  });

  test("junk is null", () => {
    expect(parseJolpicaStandings("drivers", { nope: 1 })).toBeNull();
  });
});

test("parseMotogpStandings", async () => {
  const s = parseMotogpStandings(await fixture("motogp-standings"));
  expect(s?.round).toBeNull();
  expect(s?.rows[0]).toEqual({
    pos: "1",
    name: "Martin",
    team: "Aprilia",
    points: "355",
    wins: "1",
  });
  expect(s?.rows.find((r) => r.name.endsWith("Marquez") && r.points === "353")?.name).toBe(
    "M. Marquez",
  );
});

describe("renderStandings", () => {
  const rows = [
    { pos: "1", name: "Antonelli", team: "Mercedes", points: "340", wins: "8" },
    { pos: "2", name: "Russell", team: "Mercedes", points: "238", wins: "3" },
    { pos: "10", name: "Albon", team: "Williams", points: "22", wins: "0" },
  ];

  test("drivers table with points and wins, aligned", () => {
    expect(renderStandings(seriesInfo("f1"), "drivers", { round: 17, rows })).toBe(
      [
        "## 🏆 F1 — Drivers' standings (after round 17)",
        "`P1  Antonelli Mercedes 340 8W`",
        "`P2  Russell   Mercedes 238 3W`",
        "`P10 Albon     Williams  22 0W`",
      ].join("\n"),
    );
  });

  test("constructors table has no team column", () => {
    const text = renderStandings(seriesInfo("f1"), "constructors", {
      round: 17,
      rows: [{ pos: "1", name: "Mercedes", team: "", points: "578", wins: "11" }],
    });
    expect(text).toBe("## 🏆 F1 — Constructors' standings (after round 17)\n`P1 Mercedes 578 11W`");
  });

  test("no round known", () => {
    const text = renderStandings(seriesInfo("motogp"), "drivers", { round: null, rows });
    expect(text.split("\n")[0]).toBe("## 🏆 MotoGP — Riders' standings");
  });
});

/** Serves fixtures for the URL substrings given; everything else is a 404. */
async function routes(map: Record<string, string>): Promise<FetchFn> {
  const bodies = new Map<string, string>();

  for (const [part, name] of Object.entries(map)) {
    bodies.set(part, JSON.stringify(await fixture(name)));
  }

  return async (url) => {
    for (const [part, body] of bodies) if (url.includes(part)) return new Response(body);

    return new Response("{}", { status: 404 });
  };
}

describe("fetchStandings", () => {
  test("F1 constructors from Jolpica", async () => {
    const fetchFn = await routes({
      "/f1/current/constructorStandings.json": "jolpica-constructors",
    });
    expect(
      (await fetchStandings("f1", "constructors", new Date("2026-10-15"), fetchFn))?.rows[0]?.name,
    ).toBe("Mercedes");
  });

  test("MotoGP riders via season and category", async () => {
    const fetchFn = await routes({
      "/v1/results/seasons": "motogp-seasons",
      "/v1/results/events?seasonUuid=": "motogp-events",
      "/v1/results/categories?eventUuid=": "motogp-categories",
      "/v1/results/standings?seasonUuid=e88b4e43-2209-47aa-8e83-0e0b1cedde6e&categoryUuid=e8c110ad-64aa-4e8e-8a86-f2f152f6a942":
        "motogp-standings",
    });
    expect(
      (await fetchStandings("motogp", "drivers", new Date("2026-10-15"), fetchFn))?.rows[0]?.name,
    ).toBe("Martin");
  });

  test("MotoGP constructors and other series have none", async () => {
    const fetchFn = await routes({});
    expect(await fetchStandings("motogp", "constructors", new Date(), fetchFn)).toBeNull();
    expect(await fetchStandings("wec", "drivers", new Date(), fetchFn)).toBeNull();
  });
});
