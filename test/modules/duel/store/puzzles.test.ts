import { beforeEach, expect, test } from "bun:test";
import type { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import { freshDb, puzzle, question } from "./fixtures.ts";

let repo: DuelRepo;
let db: ReturnType<typeof freshDb>["db"];

beforeEach(() => {
  ({ repo, db } = freshDb());
});

test("the first create wins", () => {
  repo.puzzles.create(puzzle({ questions: [question(1)] }));
  const again = repo.puzzles.create(puzzle({ questions: [question(2)] }));
  expect(again.questions[0]?.a.value).toBe(1);
  expect(repo.puzzles.get("g", "2026-11-03")?.questions[0]?.a.value).toBe(1);
  expect(repo.puzzles.get("h", "2026-11-03")).toBeNull();
});

test("puzzle round-trips values from the stored JSON, not the snapshot", () => {
  repo.puzzles.create(puzzle({ questions: [question(123)] }));
  const raw = db.query<{ questions: string }, []>("SELECT questions FROM duel_puzzles").get();
  expect(JSON.parse(raw?.questions ?? "[]")).toEqual([question(123)]);
  expect(repo.puzzles.get("g", "2026-11-03")?.questions).toEqual([question(123)]);
});

test("recent respects the 90-day window and excludes today", () => {
  for (const date of ["2026-08-04", "2026-08-05", "2026-11-02", "2026-11-03", "2026-11-04"]) {
    repo.puzzles.create(puzzle({ date }));
  }

  const dates = repo.puzzles.recent("g", "2026-11-03", 90).map((p) => p.date);
  expect(dates.toSorted()).toEqual(["2026-08-05", "2026-11-02"]);
  expect(repo.puzzles.recent("h", "2026-11-03", 90)).toEqual([]);
});
