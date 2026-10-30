import { expect, test } from "bun:test";
import { buttonPoints, KAOS_POINTS, typedPoints } from "../../../src/modules/trivia/scoring.ts";

test("typed points halve after hint 2 and quarter after hint 3, rounded up", () => {
  expect(([0, 1, 2] as const).map((l) => typedPoints("easy", l))).toEqual([10, 5, 3]);
  expect(([0, 1, 2] as const).map((l) => typedPoints("medium", l))).toEqual([15, 8, 4]);
  expect(([0, 1, 2] as const).map((l) => typedPoints("hard", l))).toEqual([20, 10, 5]);
});

test("button points fall from the base to half over 20 s", () => {
  expect(buttonPoints("medium", 0)).toBe(15);
  expect(buttonPoints("medium", 10_000)).toBe(11);
  expect(buttonPoints("medium", 20_000)).toBe(8);
  expect(buttonPoints("medium", 3_100)).toBe(14);
});

test("button time is clamped to 0-20 s", () => {
  expect(buttonPoints("hard", -5)).toBe(20);
  expect(buttonPoints("hard", 60_000)).toBe(10);
});

test("KAOS items are worth 10", () => expect(KAOS_POINTS).toBe(10));
