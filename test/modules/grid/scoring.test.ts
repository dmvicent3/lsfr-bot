import { describe, expect, test } from "bun:test";
import { loadSnapshotFile } from "../../../src/core/countries/load.ts";
import type { Country, Snapshot } from "../../../src/core/countries/types.ts";
import { streakBonus } from "../../../src/core/daily.ts";
import { award, cellPoints, obscurity } from "../../../src/modules/grid/scoring.ts";
import { country } from "./rules/fixtures.ts";

const pop = (iso2: string, value?: number): Country => ({
  ...country({ iso2 }),
  values: value === undefined ? {} : { population: { value, year: 2023 } },
});
const snap = (...countries: Country[]): Snapshot => ({ builtAt: "x", countries });

describe("obscurity", () => {
  test("most populous 0, least 1, in between by rank, no reading 1", () => {
    const o = obscurity(snap(pop("AA", 300), pop("BB", 100), pop("CC", 200), pop("DD")));
    expect(o.get("AA")).toBe(0);
    expect(o.get("CC")).toBe(0.5);
    expect(o.get("BB")).toBe(1);
    expect(o.get("DD")).toBe(1);
  });

  test("real snapshot: cell points run from 10 to 30", () => {
    const real = loadSnapshotFile(
      new URL("../../../src/core/countries/countries.json", import.meta.url),
    )!;
    const o = obscurity(real);
    expect(o.size).toBe(real.countries.length);
    const pts = real.countries.map((c) => cellPoints(c.iso2, o.get(c.iso2)!));
    expect(Math.min(...pts)).toBe(10);
    expect(Math.max(...pts)).toBe(30);
    expect(cellPoints("CN", o.get("CN")!)).toBe(10);
  });
});

describe("cellPoints", () => {
  test("10 + round(20 x o)", () => {
    expect(cellPoints("AA", 0)).toBe(10);
    expect(cellPoints("AA", 0.5)).toBe(20);
    expect(cellPoints("AA", 1)).toBe(30);
    expect(cellPoints("AA", 0.26)).toBe(15);
  });
});

describe("streakBonus", () => {
  test("5 per day after the first, capped at 50", () => {
    expect(streakBonus(0)).toBe(0);
    expect(streakBonus(1)).toBe(0);
    expect(streakBonus(3)).toBe(10);
    expect(streakBonus(20)).toBe(50);
  });
});

describe("award", () => {
  test("partial grid, first day", () => {
    expect(award(120, 6, 1)).toEqual({ points: 120, parts: ["6 cells: 120"] });
  });

  test("perfect adds 30", () => {
    expect(award(200, 9, 1)).toEqual({ points: 230, parts: ["9 cells: 200", "Perfect: +30"] });
  });

  test("streak bonus is 5 x (s-1), capped at 50", () => {
    expect(award(100, 5, 3)).toEqual({ points: 110, parts: ["5 cells: 100", "Streak 3: +10"] });
    expect(award(200, 9, 20)).toEqual({
      points: 280,
      parts: ["9 cells: 200", "Perfect: +30", "Streak 20: +50"],
    });
  });

  test("zero cells, no streak", () => {
    expect(award(0, 0, 0)).toEqual({ points: 0, parts: ["0 cells: 0"] });
  });
});
