import { expect, test } from "bun:test";
import { renderStats } from "../../../../src/modules/sudoku/render/stats.ts";
import type { PlayerStats } from "../../../../src/modules/sudoku/types.ts";

const STATS: PlayerStats = {
  points: 450,
  solved: { easy: 3, medium: 1, hard: 0 },
  bestMs: { easy: 754_000, medium: 1_500_000, hard: null },
  avgMs: { easy: 800_000, medium: 1_500_000, hard: null },
  currentStreak: 2,
  longestStreak: 4,
};

test("every stat line", () => {
  const t = renderStats("Ana", STATS, { today: null, week: 2, month: 1, all: 3 });
  expect(t).toContain("## 🔢 Sudoku stats — Ana");
  expect(t).toContain("**450 points**");
  expect(t).toContain("Solved: easy 3 · medium 1 · hard 0");
  expect(t).toContain("Best: easy 12m 34s · medium 25m 0s · hard —");
  expect(t).toContain("Average: easy 13m 20s · medium 25m 0s · hard —");
  expect(t).toContain("Streak 2 · best 4");
  expect(t).toContain("today unranked · week #2 · month #1 · all #3");
});
