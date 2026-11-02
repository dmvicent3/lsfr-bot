import { beforeEach, expect, test } from "bun:test";
import { finish } from "../../../../src/modules/duel/play/finish.ts";
import type { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import { freshDb, game, puzzle, question } from "../store/fixtures.ts";

let repo: DuelRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const two = puzzle({ questions: [question(), question()] });

test("finish stores correct, streak, points and time", () => {
  repo.games.start(game({ answers: "ba" }));
  const out = finish(repo, two, game({ answers: "ba" }), 77);

  expect(out.game.correct).toBe(1);
  expect(out.game.streak).toBe(1);
  expect(out.game.points).toBe(20);
  expect(out.game.finishedAt).toBe(77);
  expect(out.award?.points).toBe(20);
  expect(repo.games.get("g", "2026-11-03", "u")?.points).toBe(20);
});

test("a concurrent finish gives no award", () => {
  repo.games.start(game({ answers: "ba" }));
  finish(repo, two, game({ answers: "ba" }), 77);
  const again = finish(repo, two, game({ answers: "ba" }), 88);

  expect(again.award).toBeNull();
  expect(again.game.finishedAt).toBe(77);
});
