import { describe, expect, test } from "bun:test";
import { loadSnapshotFile } from "../../../src/core/countries/load.ts";
import { seedFor } from "../../../src/core/seed.ts";
import { lcg } from "../../../src/core/random.ts";
import { generateGrid } from "../../../src/modules/grid/generate/generate.ts";
import { validFor } from "../../../src/modules/grid/generate/valid.ts";
import { RULES } from "../../../src/modules/grid/rules/catalogue.ts";
import type { RuleId } from "../../../src/modules/grid/types.ts";
import { country } from "./rules/fixtures.ts";

const snapshot = loadSnapshotFile(
  new URL("../../../src/core/countries/countries.json", import.meta.url),
)!;
const groupsOf = (axis: RuleId[]) => axis.map((id) => RULES[id].group).filter(Boolean);
const make = (seed: number, avoid: RuleId[] = []) =>
  generateGrid({ snapshot, random: lcg(seed), avoid });

describe("validFor", () => {
  test("is the sorted intersection of both rules", () => {
    const got = validFor(snapshot, "europe", "eu");
    const want = snapshot.countries
      .filter((c) => RULES.europe.test(c) && RULES.eu.test(c))
      .map((c) => c.iso2)
      .toSorted();

    expect(got).toEqual(want);
    expect(got.length).toBeGreaterThan(10);
  });
});

describe("generateGrid", () => {
  test("satisfies the spec constraints", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const g = make(seed)!;
      const all = [...g.rows, ...g.cols];

      expect(new Set(all).size).toBe(6);
      expect(new Set(g.rows.map((id) => RULES[id].kind)).size).toBeGreaterThanOrEqual(2);
      expect(new Set(g.cols.map((id) => RULES[id].kind)).size).toBeGreaterThanOrEqual(2);
      expect(groupsOf(g.rows).some((x) => groupsOf(g.cols).includes(x))).toBe(false);
      expect(g.answers).toHaveLength(9);
      g.answers.forEach((a, i) => {
        expect(a.length).toBeGreaterThanOrEqual(3);
        expect(a.length).toBeLessThanOrEqual(40);
        expect(a).toEqual(validFor(snapshot, g.rows[Math.floor(i / 3)]!, g.cols[i % 3]!));
      });
    }
  });

  test("honours avoid", () => {
    const avoid = make(7)!.rows;
    const g = make(8, avoid)!;

    expect([...g.rows, ...g.cols].some((id) => avoid.includes(id))).toBe(false);
  });

  test("is deterministic for the same seed", () => {
    const a = generateGrid({ snapshot, random: seedFor("g", "2026-11-03"), avoid: [] });
    const b = generateGrid({ snapshot, random: seedFor("g", "2026-11-03"), avoid: [] });

    expect(a).toEqual(b);
  });

  test("returns null when impossible", () => {
    const tiny = { builtAt: "x", countries: [country({ iso2: "AA" }), country({ iso2: "BB" })] };

    expect(generateGrid({ snapshot: tiny, random: lcg(1), avoid: [] })).toBeNull();
  });

  test("succeeds for at least 99.5% of 1000 seeds", () => {
    let nulls = 0;

    for (let seed = 0; seed < 1000; seed++) if (!make(seed)) nulls++;

    expect(nulls).toBeLessThanOrEqual(5);
  });
});
