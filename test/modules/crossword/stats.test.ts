import { expect, test } from "bun:test";
import { renderLeaderboard } from "../../../src/modules/crossword/render/leaderboard.ts";
import { renderStats } from "../../../src/modules/crossword/render/stats.ts";
import { playerStats } from "../../../src/modules/crossword/stats.ts";
import { game } from "./store/fixtures.ts";

type Over = { wrong?: number; points?: number; streak?: number; solved?: boolean };

const g = (date: string, o: Over = {}) =>
  game({
    date,
    wrong: o.wrong ?? 0,
    points: o.points ?? 1,
    streak: o.streak ?? 1,
    solved: o.solved ?? true,
    finishedAt: 1,
  });

test("points, days, solved, average mistakes and streaks", () => {
  const s = playerStats(
    [
      g("2026-11-04", { points: 100 }),
      g("2026-11-05", { wrong: 3, points: 0, streak: 2, solved: false }),
      g("2026-11-06", { wrong: 3, points: 100, streak: 3 }),
    ],
    "2026-11-06",
  );

  expect(s).toMatchObject({ points: 200, days: 3, solved: 2, currentStreak: 3, longestStreak: 3 });
  expect(s.avgMistakes).toBeCloseTo(2);
});

test("current streak lives through yesterday only", () => {
  const games = [g("2026-11-04"), g("2026-11-05", { streak: 2 })];

  expect(playerStats(games, "2026-11-06").currentStreak).toBe(2);
  expect(playerStats(games, "2026-11-07").currentStreak).toBe(0);
});

test("no games, and unfinished games ignored", () => {
  expect(playerStats([], "2026-11-04")).toEqual({
    points: 0,
    days: 0,
    solved: 0,
    avgMistakes: null,
    currentStreak: 0,
    longestStreak: 0,
  });
  expect(playerStats([game({ solved: true })], "2026-11-04").days).toBe(0);
});

test("stats text lists every figure and the ranks", () => {
  const s = playerStats([g("2026-11-04", { wrong: 2, points: 90 })], "2026-11-05");
  const text = renderStats("Una", s, { today: 1, week: 2, month: null, all: 3 });

  expect(text).toContain("## 📰 Crossword — Una");
  expect(text).toContain("**90 points**");
  expect(text).toContain("Days played 1 · solved 1 · average mistakes 2");
  expect(text).toContain("Streak 1 · best 1");
});

test("leaderboard heading and row", () => {
  const range = { from: "2026-11-04", to: "2026-11-04", label: "Crossword #1" };
  const list = [{ userId: "42", points: 95, solved: 1, lastFinishedAt: 1 }];
  const page = renderLeaderboard({ range, list, page: 1, viewerId: "42" });

  expect(page.content).toContain("## 📰 Crossword — Crossword #1");
  expect(page.content).toContain("**1.** <@42> — 95 pts · 1 solved");
  expect(renderLeaderboard({ range, list: [], page: 1, viewerId: "42" }).content).toContain(
    "/crossword play",
  );
});
