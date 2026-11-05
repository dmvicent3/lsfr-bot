import { describe, expect, test } from "bun:test";
import { award, basePoints } from "../../../src/modules/snake/scoring.ts";

describe("basePoints", () => {
  test("100 on the first guess, 10 less per guess after, never under 10", () => {
    expect(basePoints(1)).toBe(100);
    expect(basePoints(2)).toBe(90);
    expect(basePoints(5)).toBe(60);
    expect(basePoints(10)).toBe(10);
    expect(basePoints(11)).toBe(10);
    expect(basePoints(40)).toBe(10);
  });
});

describe("award", () => {
  test("a solve with no streak", () =>
    expect(award(true, 3, 1)).toEqual({ points: 80, parts: ["Solved in 3 guesses: 80"] }));

  test("the streak bonus is added", () =>
    expect(award(true, 1, 3)).toEqual({
      points: 110,
      parts: ["Solved in 1 guess: 100", "Streak 3: +10"],
    }));

  test("a give-up scores nothing", () =>
    expect(award(false, 7, 0)).toEqual({ points: 0, parts: [] }));
});
