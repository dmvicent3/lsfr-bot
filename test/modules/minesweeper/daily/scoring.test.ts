import { expect, test } from "bun:test";
import { award } from "../../../../src/modules/minesweeper/daily/scoring.ts";

test("clearing in exactly 3BV clicks scores the full base", () => {
  expect(award("expert", 118, 118, 1)).toEqual({ points: 150, parts: ["Expert: 150"] });
});

test("each click over 3BV costs a point", () => {
  expect(award("intermediate", 74, 60, 1)).toEqual({
    points: 86,
    parts: ["Intermediate: 100", "14 extra clicks: −14"],
  });
  expect(award("beginner", 21, 20, 1).parts[1]).toBe("1 extra click: −1");
});

test("the penalty stops at half the base", () => {
  expect(award("expert", 318, 118, 1).points).toBe(75);
});

test("the streak bonus adds on top", () => {
  expect(award("beginner", 20, 20, 3)).toEqual({
    points: 60,
    parts: ["Beginner: 50", "Streak 3: +10"],
  });
});
