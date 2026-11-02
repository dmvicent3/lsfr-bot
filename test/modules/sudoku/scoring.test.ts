import { expect, test } from "bun:test";
import { award } from "../../../src/modules/sudoku/scoring.ts";

test("hard, no checks, first day = 150", () => {
  expect(award("hard", 0, 1).points).toBe(150);
});

test("medium, 2 checks, streak 4 = 80 + 15 = 95", () => {
  expect(award("medium", 2, 4).points).toBe(95);
});

test("checks floor at half base", () => {
  expect(award("easy", 9, 1).points).toBe(25);
});

test("streak bonus caps at 50", () => {
  expect(award("easy", 0, 20).points).toBe(100);
});

test("parts lines for checks and streak", () => {
  expect(award("medium", 2, 4).parts).toEqual(["Medium: 100", "2 checks: −20", "Streak 4: +15"]);
});

test("parts omit checks at 0 and streak at 1; singular check", () => {
  expect(award("hard", 0, 1).parts).toEqual(["Hard: 150"]);
  expect(award("easy", 1, 1).parts).toEqual(["Easy: 50", "1 check: −10"]);
});

test("floored penalty shows the applied amount", () => {
  expect(award("easy", 9, 1).parts).toEqual(["Easy: 50", "9 checks: −25"]);
});
