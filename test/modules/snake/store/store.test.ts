import { describe, expect, test } from "bun:test";
import { freshDb, game, practice } from "./fixtures.ts";

describe("puzzles", () => {
  test("the first answer of a date stays", () => {
    const { repo } = freshDb();
    expect(repo.puzzles.get("g", "2026-11-06")).toBeNull();
    expect(repo.puzzles.create("g", "2026-11-06", "planet")).toBe("planet");
    expect(repo.puzzles.create("g", "2026-11-06", "zebra")).toBe("planet");
  });

  test("since: from the first date up to, not including, the last", () => {
    const { repo } = freshDb();
    repo.puzzles.create("g", "2026-11-01", "one");
    repo.puzzles.create("g", "2026-11-02", "two");
    repo.puzzles.create("g", "2026-11-03", "three");
    repo.puzzles.create("h", "2026-11-02", "other");
    expect(repo.puzzles.since("g", "2026-11-02", "2026-11-03")).toEqual(["two"]);
  });
});

describe("games", () => {
  test("start keeps the first game; save stores guesses until finished", () => {
    const { repo } = freshDb();
    repo.games.start(game());
    expect(repo.games.start(game({ startedAt: 9 })).startedAt).toBe(1);
    expect(repo.games.save(game({ guesses: ["permit", "imply"] }))).toBe(true);
    expect(repo.games.get("g", "2026-11-06", "u")?.guesses).toEqual(["permit", "imply"]);
  });

  test("finish writes once and the finished game is read back", () => {
    const { repo } = freshDb();
    repo.games.start(game());
    const done = game({
      guesses: ["example"],
      solved: true,
      points: 100,
      streak: 1,
      finishedAt: 5,
    });
    expect(repo.games.finish(done)).toBe(true);
    expect(repo.games.finish({ ...done, points: 1 })).toBe(false);
    expect(repo.games.save(game({ guesses: ["x"] }))).toBe(false);
    expect(repo.games.get("g", "2026-11-06", "u")).toEqual(done);
    expect(repo.games.finishedBy("g", "u")).toEqual([done]);
    expect(repo.games.lastFinishedBefore("g", "u", "2026-11-07")).toEqual(done);
  });

  test("a game with no guesses reads back an empty list", () => {
    const { repo } = freshDb();
    repo.games.start(game());
    expect(repo.games.get("g", "2026-11-06", "u")?.guesses).toEqual([]);
  });
});

describe("practice", () => {
  test("replace starts over; save stops once finished", () => {
    const { repo } = freshDb();
    repo.practice.replace(practice({ guesses: ["dog"] }));
    repo.practice.replace(practice({ answer: "planet" }));
    expect(repo.practice.get("g", "u")).toMatchObject({ answer: "planet", guesses: [] });
    expect(
      repo.practice.save(practice({ answer: "planet", guesses: ["plan"], finishedAt: 3 })),
    ).toBe(true);
    expect(repo.practice.save(practice({ answer: "planet", guesses: ["x"] }))).toBe(false);
    expect(repo.practice.get("g", "u")?.guesses).toEqual(["plan"]);
  });
});
