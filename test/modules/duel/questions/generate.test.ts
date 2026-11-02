import { describe, expect, test } from "bun:test";
import { STAT_BY_ID } from "../../../../src/modules/duel/data/stats.ts";
import { BANDS, widen } from "../../../../src/modules/duel/questions/bands.ts";
import { generate } from "../../../../src/modules/duel/questions/generate.ts";
import { pickPair, recentKeys } from "../../../../src/modules/duel/questions/pick.ts";
import { seedFor } from "../../../../src/core/seed.ts";
import type { Question, Snapshot } from "../../../../src/modules/duel/types.ts";
import { seeded } from "../../shed/testing/random.ts";
import { fixtureSnapshot } from "../fixtures.ts";

const snapshot = fixtureSnapshot();
const input = { snapshot, guildId: "g1", date: "2026-11-03", recent: new Set<string>() };

function ratio(q: Question): number {
  const [x, y] = [q.a.value, q.b.value];

  return Math.max(x, y) / Math.min(x, y);
}

function fits(r: number, band: readonly [number, number] | null): boolean {
  return band !== null && r >= band[0] && r < band[1];
}

describe("seed and bands", () => {
  test("seedFor is stable and differs by input", () => {
    expect(seedFor("g", "2026-11-03")()).toBe(seedFor("g", "2026-11-03")());
    expect(seedFor("g", "2026-11-03")()).not.toBe(seedFor("g", "2026-11-04")());
  });

  test("widen returns the easier band, null for Q1", () => {
    expect(widen(0)).toBeNull();
    expect(widen(4)).toEqual(BANDS[3]!);
  });

  test("Q1 band is capped at 10x", () => {
    expect(BANDS[0]).toEqual([3, 10]);
    expect(fits(12, BANDS[0]!)).toBe(false);
  });
});

describe("generate", () => {
  test("same guild and date give the same questions; another date differs", () => {
    expect(generate(input)).toEqual(generate(input));
    expect(generate({ ...input, date: "2026-11-04" })[0]).not.toEqual(generate(input)[0]);
  });

  test("ratios sit in the band or the widened band", () => {
    for (let d = 1; d < 20; d++) {
      const qs = generate({ ...input, date: `2026-12-${String(d).padStart(2, "0")}` });

      qs.forEach((q, i) => {
        expect(fits(ratio(q), BANDS[i]!) || fits(ratio(q), widen(i))).toBe(true);
        expect(q.higher).toBe(q.a.value > q.b.value ? "a" : "b");
      });
    }
  });

  test("no repeated country or stat in a day", () => {
    const qs = generate(input);
    const isos = qs.flatMap((q) => [q.a.iso2, q.b.iso2]);

    expect(qs.length).toBeGreaterThan(0);
    expect(new Set(isos).size).toBe(isos.length);
    expect(new Set(qs.map((q) => q.stat)).size).toBe(qs.length);
  });

  test("excluded countries never appear in density questions", () => {
    for (let d = 1; d < 30; d++) {
      const qs = generate({ ...input, date: `2026-12-${String(d).padStart(2, "0")}` });

      for (const q of qs.filter((x) => x.stat === "density")) {
        expect([q.a.iso2, q.b.iso2]).not.toContain("MC");
      }
    }
  });

  test("a recent key is avoided", () => {
    const first = generate(input);
    const recent = recentKeys([{ questions: first }]);
    const again = generate({ ...input, recent });
    const keys = recentKeys([{ questions: again }]);

    for (const k of keys) expect(recent.has(k)).toBe(false);
  });

  test("returns fewer questions when stats run dry", () => {
    const small: Snapshot = { ...snapshot, countries: snapshot.countries.slice(0, 3) };

    expect(generate({ ...input, snapshot: small }).length).toBeLessThanOrEqual(1);
  });
});

describe("pickPair", () => {
  test("skips zero values", () => {
    const zeroed: Snapshot = {
      ...snapshot,
      countries: snapshot.countries.map((c) => ({
        ...c,
        values: {
          ...c.values,
          area: { value: c.iso2 === "NL" ? 0 : c.iso2.charCodeAt(0), year: 2020 },
        },
      })),
    };
    const v = { stat: STAT_BY_ID.area, used: new Set<string>(), recent: new Set<string>() };

    for (let s = 0; s < 50; s++) {
      const q = pickPair({ ...v, snapshot: zeroed, band: [1, 1000], random: seeded(s) });

      expect(q).not.toBeNull();
      expect([q!.a.iso2, q!.b.iso2]).not.toContain("NL");
    }
  });

  test("recentKeys sorts the pair", () => {
    const q = generate(input)[0]!;
    const [k] = [...recentKeys([{ questions: [q] }])];

    expect(k).toBe(`${q.stat}:${[q.a.iso2, q.b.iso2].toSorted().join(":")}`);
  });
});

const two = (a: [number, number], b: [number, number]): Snapshot => ({
  builtAt: "x",
  countries: [
    { iso2: "AA", name: "Aa", values: { co2_pc: { value: a[0], year: a[1] } } },
    { iso2: "BB", name: "Bb", values: { co2_pc: { value: b[0], year: b[1] } } },
  ],
});
const pick = (s: Snapshot) =>
  pickPair({
    snapshot: s,
    stat: STAT_BY_ID.co2_pc,
    band: [1, 2],
    used: new Set<string>(),
    recent: new Set<string>(),
    random: seeded(1),
  });

describe("pickPair rejections", () => {
  test("skips pairs that format identically", () => {
    expect(pick(two([0.04, 2023], [0.035, 2023]))).toBeNull();
    expect(pick(two([0.04, 2023], [0.06, 2023]))).not.toBeNull();
  });

  test("skips pairs whose years are more than 3 apart", () => {
    expect(pick(two([4, 2019], [6, 2023]))).toBeNull();
    expect(pick(two([4, 2020], [6, 2023]))).not.toBeNull();
  });
});
