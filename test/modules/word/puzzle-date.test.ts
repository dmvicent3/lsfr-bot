import { expect, test } from "bun:test";
import { previousDate, puzzleNumber, untilNext } from "../../../src/modules/word/puzzle-date.ts";

test("puzzle numbers count from launch", () => {
  expect(puzzleNumber("2026-10-28")).toBe(1);
  expect(puzzleNumber("2026-11-01")).toBe(5);
  expect(puzzleNumber("2027-10-28")).toBe(366);
});

test("previousDate crosses months and years", () => {
  expect(previousDate("2026-11-01")).toBe("2026-10-31");
  expect(previousDate("2027-01-01")).toBe("2026-12-31");
});

test("untilNext shows hours and minutes", () => {
  expect(untilNext(Date.UTC(2026, 6, 1, 17, 47, 30), "Europe/Lisbon")).toBe("5h 12m");
});

test("untilNext drops zero hours", () => {
  expect(untilNext(Date.UTC(2026, 6, 1, 22, 48), "Europe/Lisbon")).toBe("12m");
});
