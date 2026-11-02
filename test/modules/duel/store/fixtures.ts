import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { duelMigrations } from "../../../../src/modules/duel/store/migrations.ts";
import { DuelRepo } from "../../../../src/modules/duel/store/repo.ts";
import type { Game, Puzzle, Question } from "../../../../src/modules/duel/types.ts";

export function freshDb(): { db: Database; repo: DuelRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, duelMigrations);

  return { db, repo: new DuelRepo(db) };
}

export const question = (value = 10): Question => ({
  stat: "population",
  a: { iso2: "PT", name: "Portugal", value, year: 2023 },
  b: { iso2: "NL", name: "Netherlands", value: 20, year: 2023 },
  higher: "b",
});

export const puzzle = (over: Partial<Puzzle> = {}): Puzzle => ({
  guildId: "g",
  date: "2026-11-03",
  questions: [question()],
  ...over,
});

/** An unfinished game for user "u" on 2026-11-03 unless overridden. */
export const game = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date: "2026-11-03",
  userId: "u",
  answers: "",
  correct: null,
  points: null,
  streak: null,
  startedAt: 1,
  finishedAt: null,
  ...over,
});
