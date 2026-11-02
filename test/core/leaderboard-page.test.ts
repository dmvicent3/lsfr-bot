import { expect, test } from "bun:test";
import { rankText } from "../../src/core/leaderboard-page.ts";

test("rankText lists each period, unranked as a word", () => {
  expect(rankText({ today: 1, week: null, month: 12, all: 3 })).toBe(
    "today #1 · week unranked · month #12 · all #3",
  );
});
