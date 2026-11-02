import { expect, test } from "bun:test";
import { periodRange } from "../../../../src/modules/grid/periods.ts";
import { renderLeaderboard } from "../../../../src/modules/grid/render/leaderboard.ts";
import { renderStats } from "../../../../src/modules/grid/render/stats.ts";

const V = {
  period: "today" as const,
  range: periodRange("today", "2026-11-05"),
  list: [{ userId: "u1", points: 90, filled: 7, lastFinishedAt: 1 }],
  page: 1,
  viewerId: "u1",
};

test("leaderboard row and heading", () => {
  const c = renderLeaderboard(V).content;
  expect(c).toStartWith("## 🗺️ Country grid — Country grid #3");
  expect(c).toContain("**1.** <@u1> — 90 pts · 7 cells");
});

test("empty leaderboard", () => {
  expect(renderLeaderboard({ ...V, list: [] }).content).toContain("No games finished yet.");
});

test("stats lines", () => {
  const t = renderStats(
    "Ana",
    { points: 300, days: 4, avgFilled: 6.5, perfect: 1, currentStreak: 2, longestStreak: 3 },
    { today: null, week: 2, month: 1, all: 3 },
  );
  expect(t).toContain("## 🗺️ Country grid — Ana");
  expect(t).toContain("**300 points**");
  expect(t).toContain("Days played 4 · average 6.5/9 cells · perfect 1");
  expect(t).toContain("Streak 2 · best 3");
  expect(t).toContain("today unranked · week #2 · month #1 · all #3");
});
