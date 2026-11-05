import { expect, test } from "bun:test";
import { award, basePoints } from "../../../src/modules/groups/scoring.ts";

test("100 minus 15 per mistake", () => {
  expect(basePoints(0)).toBe(100);
  expect(basePoints(3)).toBe(55);
});

test("a solve lists its parts, with the streak bonus", () => {
  expect(award(true, 0, 1)).toEqual({ points: 100, parts: ["Solved: 100"] });
  expect(award(true, 2, 3)).toEqual({
    points: 80,
    parts: ["Solved: 100", "Mistakes: −30", "Streak 3: +10"],
  });
});

test("a loss scores nothing", () => {
  expect(award(false, 4, 0)).toEqual({ points: 0, parts: [] });
});
