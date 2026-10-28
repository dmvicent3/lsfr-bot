import { expect, test } from "bun:test";
import { award } from "../../../src/modules/word/scoring.ts";

test("first win in 4: 100 + 20, no streak bonus", () => {
  expect(award(true, 4, 1)).toEqual({
    points: 120,
    parts: ["100 solved", "20 for 2 unused attempts"],
  });
});

test("win in 1 on a 3-day streak: 100 + 50 + 10", () => {
  expect(award(true, 1, 3)).toEqual({
    points: 160,
    parts: ["100 solved", "50 for 5 unused attempts", "10 streak bonus"],
  });
});

test("one unused attempt is singular", () => {
  expect(award(true, 5, 1).parts).toEqual(["100 solved", "10 for 1 unused attempt"]);
});

test("bonus caps at 50 from an 11-day streak", () => {
  expect(award(true, 6, 11).points).toBe(150);
  expect(award(true, 6, 30).points).toBe(150);
});

test("a loss is 5", () =>
  expect(award(false, 6, 0)).toEqual({ points: 5, parts: ["5 for finishing"] }));
