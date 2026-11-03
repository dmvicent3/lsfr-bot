import { expect, test } from "bun:test";
import { EMPTY, freshDb, practice } from "./fixtures.ts";

test("replace stores a round and overwrites the previous one", () => {
  const { repo } = freshDb();
  expect(repo.practice.get("g", "u")).toBeNull();
  repo.practice.replace(practice({ wrong: 4 }));
  expect(repo.practice.get("g", "u")).toEqual(practice({ wrong: 4 }));
  repo.practice.replace(practice({ clues: ["New"], startedAt: 5 }));
  expect(repo.practice.get("g", "u")).toEqual(practice({ clues: ["New"], startedAt: 5 }));
});

test("save updates progress, refuses a finished round", () => {
  const { repo } = freshDb();
  const cells = "H" + EMPTY.slice(1);
  repo.practice.replace(practice());
  expect(repo.practice.save(practice({ cells, wrong: 3, reveals: 1, lastLine: "x" }))).toBe(true);
  expect(repo.practice.get("g", "u")).toMatchObject({ cells, wrong: 3, reveals: 1, lastLine: "x" });
  expect(repo.practice.save(practice({ wrong: 5, finishedAt: 9 }))).toBe(true);
  expect(repo.practice.save(practice({ wrong: 9, finishedAt: 10 }))).toBe(false);
  expect(repo.practice.get("g", "u")?.wrong).toBe(5);
});
