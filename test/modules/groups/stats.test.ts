import { expect, test } from "bun:test";
import { periodRange } from "../../../src/modules/groups/periods.ts";
import { standings } from "../../../src/modules/groups/ranking.ts";
import { playerStats } from "../../../src/modules/groups/stats.ts";
import { game } from "./store/fixtures.ts";

const solve = (date: string, mistakes: number, points: number, streak: number) =>
  game({ date, mistakes, points, streak, solved: true, finishedAt: 1 });

test("stats: points, days, solves, perfect solves, average mistakes, streaks", () => {
  const games = [
    solve("2026-11-05", 0, 100, 1),
    solve("2026-11-06", 2, 75, 2),
    game({ date: "2026-11-07", mistakes: 4, points: 0, streak: 0, solved: false, finishedAt: 1 }),
    solve("2026-11-08", 0, 100, 1),
  ];

  expect(playerStats(games, "2026-11-09")).toEqual({
    points: 275,
    days: 4,
    solved: 3,
    avgMistakes: 1.5,
    perfect: 2,
    currentStreak: 1,
    longestStreak: 2,
  });
});

test("standings: points, then solves", () => {
  const list = standings([
    { ...solve("2026-11-05", 0, 100, 1), userId: "a" },
    { ...game({ solved: false, points: 100, finishedAt: 1 }), userId: "b" },
    { ...solve("2026-11-05", 0, 100, 1), userId: "b", date: "2026-11-06" },
  ]);

  expect(list.map((s) => [s.userId, s.points, s.solved])).toEqual([
    ["b", 200, 1],
    ["a", 100, 1],
  ]);
});

test("the today label names the puzzle number", () => {
  expect(periodRange("today", "2026-11-07").label).toBe("Groups #3");
});
