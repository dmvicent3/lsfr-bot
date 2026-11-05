import { expect, test } from "bun:test";
import { standings } from "../../../src/modules/snake/ranking.ts";
import { playerStats } from "../../../src/modules/snake/stats.ts";
import { game } from "./store/fixtures.ts";

const solved = (date: string, guesses: number, points: number, streak: number) =>
  game({
    date,
    guesses: Array.from({ length: guesses }, (_, k) => `w${k}`),
    solved: true,
    points,
    streak,
    finishedAt: 1,
  });

test("player stats: points, days, solves, guesses over solves, streaks", () => {
  const all = [
    solved("2026-11-06", 3, 80, 1),
    solved("2026-11-07", 5, 65, 2),
    game({
      date: "2026-11-08",
      guesses: ["a", "b"],
      solved: false,
      points: 0,
      streak: 0,
      finishedAt: 1,
    }),
    solved("2026-11-09", 1, 100, 1),
  ];
  expect(playerStats(all, "2026-11-09")).toEqual({
    points: 245,
    days: 4,
    solved: 3,
    avgGuesses: 3,
    best: 1,
    currentStreak: 1,
    longestStreak: 2,
  });
});

test("no solves: no averages", () =>
  expect(playerStats([], "2026-11-09")).toMatchObject({ solved: 0, avgGuesses: null, best: null }));

test("standings: points, then solves", () => {
  const list = standings([
    game({ userId: "a", points: 50, solved: true, finishedAt: 3 }),
    game({ userId: "b", points: 50, solved: false, finishedAt: 1 }),
    game({ userId: "c", points: 90, solved: true, finishedAt: 2 }),
  ]);
  expect(list.map((s) => `${s.userId}:${s.points}:${s.solved}`)).toEqual([
    "c:90:1",
    "a:50:1",
    "b:50:0",
  ]);
});
