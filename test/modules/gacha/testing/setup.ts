import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import type { PointsSource } from "../../../../src/core/points-types.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { Pools } from "../../../../src/modules/gacha/engine/types.ts";
import { gachaMigrations } from "../../../../src/modules/gacha/store/migrations.ts";
import { GachaRepo } from "../../../../src/modules/gacha/store/repo.ts";

export const POOLS: Pools = {
  5: ["f1", "f2", "f3"],
  4: ["q1", "q2", "q3", "q4", "q5"],
  3: ["t1", "t2", "t3"],
};

export const ME = { guildId: "g", userId: "u" };

/** A points source that says each player earned what `earned` holds. */
export function fixedPoints(earned: Map<string, number>): PointsSource {
  return { game: "test", label: "Test", earned: (_db, who) => earned.get(who.userId) ?? 0 };
}

export function setup(earned = new Map([["u", 1000]])) {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...gachaMigrations]);
  const repo = new GachaRepo(db);

  return { db, repo, earned, sources: [fixedPoints(earned)] };
}
