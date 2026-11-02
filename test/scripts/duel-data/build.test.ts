import { describe, expect, test } from "bun:test";
import { build } from "../../../scripts/duel-data/build.ts";
import { loadSnapshot } from "../../../src/modules/duel/data/load.ts";
import { STATS } from "../../../src/modules/duel/data/stats.ts";
import type { Reading, StatId } from "../../../src/modules/duel/types.ts";

function readings(skip: Record<string, number>): Record<StatId, Map<string, Reading>> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the loop below fills every stat
  const out = {} as Record<StatId, Map<string, Reading>>;

  STATS.forEach((s, i) => {
    out[s.id] = new Map();

    for (const iso2 of ["NL", "PT", "AW", "KR"]) {
      if (i < STATS.length - (skip[iso2] ?? 0)) out[s.id].set(iso2, { value: i + 1, year: 2022 });
    }
  });

  return out;
}

const COUNTRIES = [
  { iso2: "PT", name: "Portugal" },
  { iso2: "NL", name: "Netherlands" },
  { iso2: "AW", name: "Aruba" },
];

describe("build", () => {
  test("drops a country with 7 stats and sorts by name", () => {
    const snap = build(COUNTRIES, readings({ AW: 7 }), "2026-11-02");

    expect(snap.countries.map((c) => c.iso2)).toEqual(["NL", "PT"]);
    expect(snap.builtAt).toBe("2026-11-02");
  });

  test("keeps a country with exactly 8 stats", () => {
    const snap = build(COUNTRIES, readings({ AW: STATS.length - 8 }), "2026-11-02");

    expect(snap.countries.map((c) => c.iso2)).toEqual(["AW", "NL", "PT"]);
  });

  test("loadSnapshot round-trips", () => {
    const snap = build(COUNTRIES, readings({}), "2026-11-02");

    expect(loadSnapshot(JSON.parse(JSON.stringify(snap)))).toEqual(snap);
  });

  test("applies a name override and leaves other names alone", () => {
    const list = [
      { iso2: "KR", name: "Korea, Rep." },
      { iso2: "PT", name: "Portugal" },
    ];
    const snap = build(list, readings({}), "2026-11-02");

    expect(snap.countries.map((c) => c.name)).toEqual(["Portugal", "South Korea"]);
  });

  test("drops readings of zero or below", () => {
    const r = readings({});
    const id: StatId = "population";

    r[id].set("PT", { value: 0, year: 2022 });

    const snap = build(COUNTRIES, r, "2026-11-02");

    expect(snap.countries.find((c) => c.iso2 === "PT")?.values[id]).toBeUndefined();
  });
});
