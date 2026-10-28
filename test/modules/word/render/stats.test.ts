import { expect, test } from "bun:test";
import { renderStats } from "../../../../src/modules/word/render/stats.ts";
import type { PlayerStats } from "../../../../src/modules/word/types.ts";

const STATS: PlayerStats = {
  points: 270,
  wins: 2,
  losses: 1,
  winRate: 2 / 3,
  currentStreak: 0,
  longestStreak: 2,
  totalGuesses: 12,
  avgAttempts: 3,
  distribution: [0, 1, 0, 4, 0, 0],
};
const RANKS = {
  today: null,
  week: { rank: 2, of: 5 },
  month: { rank: 1, of: 9 },
  all: { rank: 3, of: 12 },
};

test("every stat line", () => {
  const t = renderStats({ userId: "u1", stats: STATS, ranks: RANKS });
  expect(t).toContain("<@u1>");
  expect(t).toContain("270 points");
  expect(t).toContain("2 W · 1 L · 67%");
  expect(t).toContain("Streak 0 · best 2");
  expect(t).toContain("12 guesses · 3.0 per win");
  expect(t).toContain("today unranked · week #2 of 5 · month #1 of 9 · all #3 of 12");
});

test("distribution bars scale to the biggest, at least one block when not zero", () => {
  const t = renderStats({ userId: "u1", stats: STATS, ranks: RANKS });
  expect(t).toContain("`2` ███ 1");
  expect(t).toContain("`4` ██████████ 4");
  expect(t).toContain("`1`  0");
});

test("no wins shows dashes", () => {
  const t = renderStats({
    userId: "u1",
    stats: { ...STATS, wins: 0, losses: 0, winRate: null, avgAttempts: null },
    ranks: RANKS,
  });
  expect(t).toContain("0 W · 0 L · –");
  expect(t).toContain("per win –");
});
