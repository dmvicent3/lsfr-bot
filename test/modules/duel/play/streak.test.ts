import { beforeEach, expect, test } from "bun:test";
import { dailyStreak } from "../../../../src/modules/duel/play/streak.ts";
import type { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import { freshDb, game } from "../store/fixtures.ts";

let repo: DuelRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const finished = (date: string, streak: number) =>
  repo.games.start(game({ date, answers: "b", correct: 1, points: 20, streak, finishedAt: 5 }));

test("a first game is day 1", () => {
  expect(dailyStreak(repo, game())).toBe(1);
});

test("playing after yesterday extends", () => {
  finished("2026-11-02", 3);
  expect(dailyStreak(repo, game())).toBe(4);
});

test("a gap restarts at 1", () => {
  finished("2026-10-30", 3);
  expect(dailyStreak(repo, game())).toBe(1);
});
