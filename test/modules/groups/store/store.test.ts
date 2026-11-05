import { expect, test } from "bun:test";
import { PUZZLE } from "../play/fixtures.ts";
import { freshDb, game, practice } from "./fixtures.ts";

test("a game starts once and reads back as stored", () => {
  const { repo } = freshDb();
  const first = repo.games.start(game({ picked: "12" }));

  expect(first).toEqual(game({ picked: "12" }));
  expect(repo.games.start(game({ startedAt: 9 })).startedAt).toBe(1);
});

test("save stores progress until the game is finished", () => {
  const { repo } = freshDb();
  repo.games.start(game());
  const moved = game({ found: "2", guesses: "0124", mistakes: 1, lastLine: "x", order: "fe" });

  expect(repo.games.save(moved)).toBe(true);
  expect(repo.games.get("g", "2026-11-05", "u")).toEqual(moved);

  const done = { ...moved, solved: true, points: 85, streak: 2, finishedAt: 5 };

  expect(repo.games.finish(done)).toBe(true);
  expect(repo.games.get("g", "2026-11-05", "u")).toEqual(done);
  expect(repo.games.finish(done)).toBe(false);
  expect(repo.games.save(moved)).toBe(false);
});

test("finished games by range, by player, and the last before a date", () => {
  const { repo } = freshDb();

  for (const date of ["2026-11-05", "2026-11-06"]) {
    repo.games.start(game({ date }));
    repo.games.finish(game({ date, solved: false, points: 0, streak: 0, finishedAt: 3 }));
  }

  repo.games.start(game({ date: "2026-11-07" }));

  expect(repo.games.finishedIn("g", { from: "2026-11-06", to: "2026-11-07", label: "" })).toHaveLength(1);
  expect(repo.games.finishedBy("g", "u").map((g) => g.date)).toEqual(["2026-11-05", "2026-11-06"]);
  expect(repo.games.lastFinishedBefore("g", "u", "2026-11-07")?.date).toBe("2026-11-06");
});

test("practice: replace keeps one round per player, save stops once finished", () => {
  const { repo } = freshDb();
  repo.practice.replace(practice());
  repo.practice.replace(practice({ startedAt: 2 }));

  expect(repo.practice.get("g", "u")).toEqual(practice({ startedAt: 2 }));

  const done = practice({ startedAt: 2, found: "0123", finishedAt: 4 });

  expect(repo.practice.save(done)).toBe(true);
  expect(repo.practice.save(done)).toBe(false);
  expect(repo.practice.get("g", "u")).toEqual(done);
});

test("puzzles: create keeps the first, since lists a date range", () => {
  const { repo } = freshDb();
  repo.puzzles.create("g", "2026-11-04", PUZZLE);
  const other = { ...PUZZLE, order: "fedcba9876543210" };

  expect(repo.puzzles.create("g", "2026-11-04", other)).toEqual(PUZZLE);
  repo.puzzles.create("g", "2026-11-05", other);
  expect(repo.puzzles.since("g", "2026-11-01", "2026-11-05")).toEqual([PUZZLE]);
  expect(repo.puzzles.get("g", "2026-11-06")).toBeNull();
});
