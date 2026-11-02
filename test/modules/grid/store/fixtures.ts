import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { gridMigrations } from "../../../../src/modules/grid/store/migrations.ts";
import { GridRepo } from "../../../../src/modules/grid/store/repo.ts";
import type { Game, Grid, Practice, Puzzle } from "../../../../src/modules/grid/types.ts";

export function freshDb(): { db: Database; repo: GridRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, gridMigrations);

  return { db, repo: new GridRepo(db) };
}

export const grid = (): Grid => ({
  rows: ["europe", "asia", "africa"],
  cols: ["eu", "nato", "monarchy"],
  answers: Array.from({ length: 9 }, (_, i) => ["PT", `X${i}`]),
});

export const puzzle = (over: Partial<Puzzle> = {}): Puzzle => ({
  guildId: "g",
  date: "2026-11-03",
  grid: grid(),
  ...over,
});

const empty = () => Array.from({ length: 9 }, () => "");

export const game = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date: "2026-11-03",
  userId: "u",
  cells: empty(),
  guesses: 0,
  lastMiss: null,
  filled: null,
  points: null,
  streak: null,
  startedAt: 1,
  finishedAt: null,
  ...over,
});

export const practice = (over: Partial<Practice> = {}): Practice => ({
  guildId: "g",
  userId: "u",
  grid: grid(),
  cells: empty(),
  guesses: 0,
  lastMiss: null,
  points: 0,
  startedAt: 1,
  finishedAt: null,
  ...over,
});
