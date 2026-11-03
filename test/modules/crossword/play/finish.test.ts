import { beforeEach, expect, test } from "bun:test";
import { finish } from "../../../../src/modules/crossword/play/finish.ts";
import { giveUp } from "../../../../src/modules/crossword/play/give-up.ts";
import { dailyStreak } from "../../../../src/modules/crossword/play/streak.ts";
import type { CrosswordRepo } from "../../../../src/modules/crossword/store/repo.ts";
import { freshDb, game, practice } from "../store/fixtures.ts";

let repo: CrosswordRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const playing = (over = {}) => game({ wrong: 2, reveals: 1, ...over });

test("a solved finish stores points, streak and time, and awards once", () => {
  repo.games.start(playing());
  const out = finish(repo, playing(), true, 77);

  expect(out.game).toMatchObject({ solved: true, streak: 1, points: 80, finishedAt: 77 });
  expect(out.award).toEqual({
    points: 80,
    parts: ["Solved: 100", "Mistakes: −10", "Reveals: −10"],
  });
  expect(repo.games.get("g", "2026-11-03", "u")).toMatchObject({ points: 80, solved: true });
});

test("a second finish writes nothing and awards nothing", () => {
  repo.games.start(playing());
  finish(repo, playing(), true, 77);
  const again = finish(repo, playing({ wrong: 0 }), true, 88);

  expect(again.award).toBeNull();
  expect(again.game).toMatchObject({ points: 80, finishedAt: 77 });
});

test("giving up scores 0 but the day counts toward the streak", () => {
  repo.games.start(playing());
  const out = giveUp(repo, playing(), 50);

  expect(out.award).toEqual({ points: 0, parts: [] });
  expect(out.game).toMatchObject({ solved: false, points: 0, streak: 1, finishedAt: 50 });
  expect(dailyStreak(repo, playing({ date: "2026-11-04" }))).toBe(2);
});

test("giving up a finished round changes nothing", () => {
  repo.games.start(playing());
  const done = finish(repo, playing(), true, 77).game;

  expect(giveUp(repo, done, 99)).toEqual({ game: done, award: null });
});

test("a streak carries and adds its bonus", () => {
  repo.games.start(game({ date: "2026-11-02" }));
  finish(repo, game({ date: "2026-11-02" }), true, 1);
  repo.games.start(game());
  const out = finish(repo, game(), true, 2);

  expect(out.game.streak).toBe(2);
  expect(out.award?.points).toBe(105);
});

test("a practice give-up stores the end without an award", () => {
  repo.practice.replace(practice());
  const out = giveUp(repo, practice(), 9);

  expect(out.award).toBeNull();
  expect(repo.practice.get("g", "u")?.finishedAt).toBe(9);
});
