import { expect, test } from "bun:test";
import { dailyLookup, dayOf, isDateKey } from "../../src/core/daily-guard.ts";

const repo = {
  puzzles: { get: (g: string, d: string) => (g === "g" && d === "2026-11-04" ? { p: 1 } : null) },
  games: {
    get: (g: string, d: string, u: string) =>
      g === "g" && d === "2026-11-04" && u === "u" ? { won: false } : null,
  },
};

test("isDateKey accepts only YYYY-MM-DD", () => {
  expect(isDateKey("2026-11-04")).toBe(true);
  expect(isDateKey("practice")).toBe(false);
  expect(isDateKey("2026-11-4")).toBe(false);
  expect(isDateKey("x2026-11-04")).toBe(false);
});

test("dailyLookup returns the puzzle and the player's game", () => {
  expect(dailyLookup(repo, "g", "2026-11-04", "u")).toEqual({
    puzzle: { p: 1 },
    game: { won: false },
  });
});

test("dailyLookup is null for a bad date, missing puzzle or missing game", () => {
  expect(dailyLookup(repo, "g", "practice", "u")).toBeNull();
  expect(dailyLookup(repo, "g", "2026-11-05", "u")).toBeNull();
  expect(dailyLookup(repo, "g", "2026-11-04", "other")).toBeNull();
  expect(dailyLookup(repo, "h", "2026-11-04", "u")).toBeNull();
});

test("dayOf gives the puzzle number and the time to the next puzzle", () => {
  const now = Date.UTC(2026, 10, 4, 18, 48);
  expect(dayOf("2026-11-04", "2026-11-03", now, "UTC")).toEqual({ number: 2, untilNext: "5h 12m" });
});
