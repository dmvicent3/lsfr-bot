import { describe, expect, test } from "bun:test";
import { award, basePoints } from "../../../src/modules/crossword/scoring.ts";

describe("basePoints", () => {
  test("100 minus 5 per mistake and 10 per reveal, floor 0", () => {
    expect(basePoints(0, 0)).toBe(100);
    expect(basePoints(2, 1)).toBe(80);
    expect(basePoints(30, 5)).toBe(0);
  });
});

describe("award", () => {
  test("perfect first day", () => {
    expect(award(true, 0, 0, 1)).toEqual({ points: 100, parts: ["Solved: 100"] });
  });

  test("mistakes and reveals show as deductions", () => {
    expect(award(true, 2, 1, 1)).toEqual({
      points: 80,
      parts: ["Solved: 100", "Mistakes: −10", "Reveals: −10"],
    });
  });

  test("streak 3 adds 10, capped at 50", () => {
    expect(award(true, 0, 0, 3)).toEqual({ points: 110, parts: ["Solved: 100", "Streak 3: +10"] });
    expect(award(true, 0, 0, 20).points).toBe(150);
  });

  test("floor at 0 before the streak bonus", () => {
    expect(award(true, 30, 5, 3).points).toBe(10);
  });

  test("give up is 0 with no streak bonus", () => {
    expect(award(false, 3, 2, 9)).toEqual({ points: 0, parts: [] });
  });
});
