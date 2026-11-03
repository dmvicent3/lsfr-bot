import { expect, test } from "bun:test";
import { freshDb, stored } from "./fixtures.ts";

test("create round-trips and the first create wins", () => {
  const { repo } = freshDb();
  repo.puzzles.create("g", "2026-11-03", stored());
  expect(repo.puzzles.create("g", "2026-11-03", stored({ clues: ["Other"] }))).toEqual(stored());
  expect(repo.puzzles.get("g", "2026-11-03")).toEqual(stored());
  expect(repo.puzzles.get("g", "2026-11-04")).toBeNull();
});

test("since lists a guild's puzzles from a date up to, not including, another", () => {
  const { repo } = freshDb();

  for (const date of ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"]) {
    repo.puzzles.create("g", date, stored({ clues: [date] }));
  }

  repo.puzzles.create("other", "2026-11-02", stored());

  expect(repo.puzzles.since("g", "2026-11-02", "2026-11-04").map((s) => s.clues[0])).toEqual([
    "2026-11-02",
    "2026-11-03",
  ]);
});
