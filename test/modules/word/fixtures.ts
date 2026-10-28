import { Database } from "bun:sqlite";
import { runMigrations } from "../../../src/core/db.ts";
import { WordRepo } from "../../../src/modules/word/store/repo.ts";
import { wordMigrations } from "../../../src/modules/word/store/migrations.ts";
import type { Game } from "../../../src/modules/word/types.ts";

export function freshDb(): { db: Database; repo: WordRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, wordMigrations);

  return { db, repo: new WordRepo(db) };
}

/** A finished win in 3 for 130 unless overridden. */
export const game = (userId: string, date: string, over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date,
  userId,
  guesses: ["aaaaa", "bbbbb", "ccccc"],
  won: true,
  points: 130,
  streak: 1,
  finishedAt: 1,
  ...over,
});

/** Stores a finished game as it would be after the last guess. */
export function seed(repo: WordRepo, g: Game): void {
  repo.games.finish(g);
}
