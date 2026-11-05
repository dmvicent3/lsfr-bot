import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { snakeMigrations } from "../../../../src/modules/snake/store/migrations.ts";
import { SnakeRepo } from "../../../../src/modules/snake/store/repo.ts";
import type { Game, Practice } from "../../../../src/modules/snake/types.ts";

export const ANSWER = "example";

export function freshDb(): { db: Database; repo: SnakeRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, snakeMigrations);

  return { db, repo: new SnakeRepo(db) };
}

export const game = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date: "2026-11-06",
  userId: "u",
  guesses: [],
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
  answer: ANSWER,
  guesses: [],
  startedAt: 1,
  finishedAt: null,
  ...over,
});

/** The accepted words the tests guess. */
export const WORDS: ReadonlySet<string> = new Set([
  "permit",
  "imply",
  "excuse",
  "example",
  "examples",
  "dog",
  "plan",
  "planet",
  "lemon",
  "zebra",
  "ample",
  "exam",
  "lamp",
  "maple",
  "pixel",
  "pole",
  "type",
  "apple",
  "simple",
  "temple",
]);

export const anyWord = (): ReadonlySet<string> => WORDS;
