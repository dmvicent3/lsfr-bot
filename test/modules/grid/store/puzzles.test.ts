import { expect, test } from "bun:test";
import { freshDb, grid, puzzle } from "./fixtures.ts";
import type { Grid } from "../../../../src/modules/grid/types.ts";

test("create round-trips and the first create wins", () => {
  const { repo } = freshDb();
  repo.puzzles.create(puzzle());
  const other: Grid = { ...grid(), rows: ["eu", "eu", "eu"] };
  expect(repo.puzzles.create(puzzle({ grid: other }))).toEqual(puzzle());
  expect(repo.puzzles.get("g", "2026-11-03")).toEqual(puzzle());
  expect(repo.puzzles.get("g", "2026-11-04")).toBeNull();
});

test("previous is yesterday's row only", () => {
  const { repo } = freshDb();
  repo.puzzles.create(puzzle({ date: "2026-11-01" }));
  expect(repo.puzzles.previous("g", "2026-11-03")).toBeNull();
  repo.puzzles.create(puzzle({ date: "2026-11-02" }));
  expect(repo.puzzles.previous("g", "2026-11-03")?.date).toBe("2026-11-02");
  expect(repo.puzzles.previous("x", "2026-11-03")).toBeNull();
});
