import { beforeEach, expect, test } from "bun:test";
import type { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import { freshDb, game } from "./fixtures.ts";

let repo: DuelRepo;

beforeEach(() => {
  repo = freshDb().repo;
});

const done = (over = {}) =>
  game({ answers: "ab", correct: 2, points: 5, streak: 1, finishedAt: 9, ...over });

test("start twice keeps the first", () => {
  repo.games.start(game({ startedAt: 1 }));
  const again = repo.games.start(game({ startedAt: 2 }));
  expect(again.startedAt).toBe(1);
  expect(repo.games.get("g", "2026-11-03", "u")?.startedAt).toBe(1);
  expect(repo.games.get("g", "2026-11-03", "x")).toBeNull();
});

test("save stores progress and refuses a finished game", () => {
  repo.games.start(game());
  expect(repo.games.save(game({ answers: "a" }))).toBe(true);
  expect(repo.games.get("g", "2026-11-03", "u")?.answers).toBe("a");
  expect(repo.games.save(done())).toBe(true);
  expect(repo.games.save(done({ answers: "bb", points: 99 }))).toBe(false);
  expect(repo.games.get("g", "2026-11-03", "u")?.points).toBe(5);
});

test("finishedIn filters by range and skips unfinished games", () => {
  for (const date of ["2026-11-01", "2026-11-03", "2026-11-05"]) {
    repo.games.start(game({ date }));
    repo.games.save(done({ date }));
  }

  repo.games.start(game({ date: "2026-11-04" }));
  const range = { from: "2026-11-02", to: "2026-11-04", label: "x" };
  expect(repo.games.finishedIn("g", range).map((g) => g.date)).toEqual(["2026-11-03"]);
});

test("finishedBy lists a player's finished games oldest first", () => {
  for (const date of ["2026-11-05", "2026-11-01"]) {
    repo.games.start(game({ date }));
    repo.games.save(done({ date }));
  }

  repo.games.start(game({ date: "2026-11-02" }));
  expect(repo.games.finishedBy("g", "u").map((g) => g.date)).toEqual(["2026-11-01", "2026-11-05"]);
});

test("lastFinishedBefore ignores the same date", () => {
  for (const date of ["2026-11-01", "2026-11-03"]) {
    repo.games.start(game({ date }));
    repo.games.save(done({ date }));
  }

  expect(repo.games.lastFinishedBefore("g", "u", "2026-11-03")?.date).toBe("2026-11-01");
  expect(repo.games.lastFinishedBefore("g", "u", "2026-11-01")).toBeNull();
});
