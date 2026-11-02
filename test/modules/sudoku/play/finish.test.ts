import { beforeEach, expect, test } from "bun:test";
import { finish } from "../../../../src/modules/sudoku/play/finish.ts";
import type { SudokuRepo } from "../../../../src/modules/sudoku/store/repo.ts";
import { freshDb, game } from "../store/fixtures.ts";

let repo: SudokuRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

test("a daily finish stores streak and points", () => {
  const g = repo.games.start(game({ checks: 1 }));
  const out = finish(repo, g, 500);
  expect(out.game).toMatchObject({ solvedAt: 500, streak: 1, points: 40 });
  expect(out.award?.points).toBe(40);
  expect(repo.games.get(g)).toMatchObject({ solvedAt: 500, points: 40, streak: 1 });
});

test("the streak bonus counts", () => {
  repo.games.start(game({ date: "2026-11-02", solvedAt: 1, points: 50, streak: 2 }));
  const g = repo.games.start(game());
  expect(finish(repo, g, 500).award?.points).toBe(60);
});

test("a practice finish has no award", () => {
  const p = { kind: "practice" as const, date: "", slot: "" };
  const g = repo.games.replace(game(p));
  const out = finish(repo, g, 500);
  expect(out.award).toBeNull();
  expect(out.game).toMatchObject({ solvedAt: 500, points: null, streak: null });
  expect(repo.games.get(g)?.solvedAt).toBe(500);
});

test("a concurrent finish returns the stored game and no award", () => {
  const g = repo.games.start(game());
  finish(repo, g, 500);
  const again = finish(repo, g, 900);
  expect(again.award).toBeNull();
  expect(again.game.solvedAt).toBe(500);
});
