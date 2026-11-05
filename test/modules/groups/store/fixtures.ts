import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { groupsMigrations } from "../../../../src/modules/groups/store/migrations.ts";
import { GroupsRepo } from "../../../../src/modules/groups/store/repo.ts";
import type { Game, Practice } from "../../../../src/modules/groups/types.ts";
import { PUZZLE, progress } from "../play/fixtures.ts";

export function freshDb(): { db: Database; repo: GroupsRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, groupsMigrations);

  return { db, repo: new GroupsRepo(db) };
}

export const game = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  date: "2026-11-05",
  userId: "u",
  ...progress(),
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
  puzzle: PUZZLE,
  ...progress(),
  startedAt: 1,
  finishedAt: null,
  ...over,
});
