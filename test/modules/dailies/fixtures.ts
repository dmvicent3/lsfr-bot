import { Database } from "bun:sqlite";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { crosswordMigrations } from "../../../src/modules/crossword/store/migrations.ts";
import { duelMigrations } from "../../../src/modules/duel/store/migrations.ts";
import { gridMigrations } from "../../../src/modules/grid/store/migrations.ts";
import { groupsMigrations } from "../../../src/modules/groups/store/migrations.ts";
import { snakeMigrations } from "../../../src/modules/snake/store/migrations.ts";
import { sudokuMigrations } from "../../../src/modules/sudoku/store/migrations.ts";
import { triviaMigrations } from "../../../src/modules/trivia/store/migrations.ts";
import { wordMigrations } from "../../../src/modules/word/store/migrations.ts";

/** An in-memory DB with the settings table and every daily's tables. */
export function freshDailiesDb(): Database {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [
    ...coreMigrations,
    ...wordMigrations,
    ...sudokuMigrations,
    ...duelMigrations,
    ...gridMigrations,
    ...crosswordMigrations,
    ...groupsMigrations,
    ...snakeMigrations,
    ...triviaMigrations,
  ]);

  return db;
}
