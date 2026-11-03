import { beforeEach, expect, test } from "bun:test";
import { finish } from "../../../../src/modules/grid/play/finish.ts";
import { giveUp } from "../../../../src/modules/grid/play/give-up.ts";
import { healed } from "../../../../src/modules/grid/play/heal.ts";
import { streakOf } from "../../../../src/core/daily.ts";
import type { GridRepo } from "../../../../src/modules/grid/store/repo.ts";
import { freshDb, game, practice } from "../store/fixtures.ts";

let repo: GridRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const cells = (n: number) => Array.from({ length: 9 }, (_, i) => (i < n ? `X${i}` : ""));
const playing = (n: number, points = 100) => game({ cells: cells(n), guesses: 9, points });

test("finish stores filled, streak, points and time", () => {
  repo.games.start(playing(3));
  const out = finish(repo, playing(3), 77);

  expect(out.game).toMatchObject({ filled: 3, streak: 1, points: 100, finishedAt: 77 });
  expect(out.award?.points).toBe(100);
  expect(repo.games.get("g", "2026-11-03", "u")?.points).toBe(100);
});

test("a perfect grid adds the bonus", () => {
  repo.games.start(playing(9, 200));
  const out = finish(repo, playing(9, 200), 77);

  expect(out.award?.points).toBe(230);
  expect(out.award?.parts).toContain("Perfect: +30");
});

test("a concurrent finish gives no award", () => {
  repo.games.start(playing(3));
  finish(repo, playing(3), 77);
  const again = finish(repo, playing(3), 88);

  expect(again.award).toBeNull();
  expect(again.game.finishedAt).toBe(77);
});

test("give up finishes with what is filled", () => {
  const g = game({ cells: cells(2), guesses: 2, points: 40 });
  repo.games.start(g);
  const out = giveUp(repo, g, 50);

  expect(out.game).toMatchObject({ filled: 2, finishedAt: 50, points: 40 });
});

test("heal finishes a stored game that is over but unfinished", () => {
  repo.games.start(playing(3));
  const out = healed(repo, playing(3), 60);

  expect(out.game.finishedAt).toBe(60);
  expect(out.award).not.toBeNull();
  expect(healed(repo, game({ guesses: 2 }), 60)).toEqual({
    game: game({ guesses: 2 }),
    award: null,
  });
});

test("a practice round gives up and heals through the same functions, with no award", () => {
  const p = practice({ cells: cells(2), guesses: 2, points: 40 });
  repo.practice.replace(p);
  const out = giveUp(repo, p, 50);

  expect(out.game).toMatchObject({ finishedAt: 50, points: 40 });
  expect(out.award).toBeNull();
  expect(repo.practice.get("g", "u")?.finishedAt).toBe(50);

  const over = practice({ cells: cells(3), guesses: 9 });
  repo.practice.replace(over);

  expect(healed(repo, over, 60).game.finishedAt).toBe(60);
  expect(repo.practice.get("g", "u")?.finishedAt).toBe(60);
  expect(healed(repo, p, 70).game).toBe(p);
});

test("giving up a round that is already finished changes nothing", () => {
  const done = game({ cells: cells(2), guesses: 2, filled: 2, points: 40, finishedAt: 5 });
  repo.games.start(done);

  expect(giveUp(repo, done, 50)).toEqual({ game: done, award: null });
});

const finished = (date: string, streak: number) =>
  repo.games.start(game({ date, filled: 1, points: 20, streak, finishedAt: 5 }));

test("streak: first day, extend, reset", () => {
  expect(streakOf(repo.games, game())).toBe(1);
  finished("2026-11-02", 3);
  expect(streakOf(repo.games, game())).toBe(4);
  expect(streakOf(repo.games, game({ date: "2026-11-05" }))).toBe(1);
});
