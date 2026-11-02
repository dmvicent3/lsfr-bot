import { expect, test } from "bun:test";
import { freshDb, grid, practice } from "./fixtures.ts";
import type { Grid } from "../../../../src/modules/grid/types.ts";

test("replace stores a round and overwrites the previous one", () => {
  const { repo } = freshDb();
  expect(repo.practice.get("g", "u")).toBeNull();
  repo.practice.replace(practice({ points: 40, guesses: 4 }));
  expect(repo.practice.get("g", "u")).toEqual(practice({ points: 40, guesses: 4 }));
  const g: Grid = { ...grid(), cols: ["eu", "eu", "eu"] };
  repo.practice.replace(practice({ grid: g, startedAt: 5 }));
  expect(repo.practice.get("g", "u")).toEqual(practice({ grid: g, startedAt: 5 }));
});

test("save updates progress, refuses a finished round", () => {
  const { repo } = freshDb();
  repo.practice.replace(practice());
  expect(repo.practice.save(practice({ guesses: 3, lastMiss: "ES", points: 10 }))).toBe(true);
  expect(repo.practice.get("g", "u")).toMatchObject({ guesses: 3, lastMiss: "ES", points: 10 });
  expect(repo.practice.save(practice({ points: 50, finishedAt: 9 }))).toBe(true);
  expect(repo.practice.save(practice({ points: 99, finishedAt: 10 }))).toBe(false);
  expect(repo.practice.get("g", "u")?.points).toBe(50);
});
