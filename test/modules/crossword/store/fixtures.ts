import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { crosswordMigrations } from "../../../../src/modules/crossword/store/migrations.ts";
import { CrosswordRepo } from "../../../../src/modules/crossword/store/repo.ts";
import type {
  Game,
  Practice,
  Puzzle,
  StoredPuzzle,
} from "../../../../src/modules/crossword/types.ts";

export function freshDb(): { db: Database; repo: CrosswordRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, crosswordMigrations);

  return { db, repo: new CrosswordRepo(db) };
}

export const puzzle = (): Puzzle => ({
  size: 5,
  blocks: [6, 8],
  slots: [{ n: 1, dir: "a", cells: [0, 1, 2, 3, 4] }],
  answers: ["house"],
});

export const stored = (over: Partial<StoredPuzzle> = {}): StoredPuzzle => ({
  puzzle: puzzle(),
  clues: ["Home"],
  ...over,
});

export const EMPTY = ".".repeat(25);

export const game = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date: "2026-11-03",
  userId: "u",
  cells: EMPTY,
  wrong: 0,
  reveals: 0,
  lastLine: null,
  solved: null,
  points: null,
  streak: null,
  startedAt: 1,
  finishedAt: null,
  ...over,
});

export const practice = (over: Partial<Practice> = {}): Practice => ({
  guildId: "g",
  userId: "u",
  ...stored(),
  cells: EMPTY,
  wrong: 0,
  reveals: 0,
  lastLine: null,
  startedAt: 1,
  finishedAt: null,
  ...over,
});
