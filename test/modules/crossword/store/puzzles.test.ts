import { expect, test } from "bun:test";
import { freshDb, stored } from "./fixtures.ts";

test("create round-trips and the first create wins", () => {
  const { repo } = freshDb();
  repo.puzzles.create("g", "2026-11-03", stored());
  expect(repo.puzzles.create("g", "2026-11-03", stored({ clues: ["Other"] }))).toEqual(stored());
  expect(repo.puzzles.get("g", "2026-11-03")).toEqual(stored());
  expect(repo.puzzles.get("g", "2026-11-04")).toBeNull();
});
