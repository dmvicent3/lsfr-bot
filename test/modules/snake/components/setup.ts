import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import type { SnakeRepo } from "../../../../src/modules/snake/store/repo.ts";
import type { Game, Practice } from "../../../../src/modules/snake/types.ts";
import { ANSWER, freshDb, game, practice } from "../store/fixtures.ts";

export const DATE = "2026-11-08";
/** startedAt 1 in base 36, as the fixtures' rounds carry it. */
export const STAMP = "1";

/** A database with today's answer and, unless null, the player's game or practice round. */
export function setup(over: Partial<Game> | null = {}, round: Partial<Practice> | null = null) {
  const { db, repo } = freshDb();
  runMigrations(db, coreMigrations);
  repo.puzzles.create("g", DATE, ANSWER);

  if (over) {
    const g = game({ date: DATE, ...over });
    repo.games.start(g);

    if (g.finishedAt !== null) repo.games.finish(g);
  }

  if (round) repo.practice.replace(practice(round));

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  return { db, repo, ctx: { db } as unknown as Ctx };
}

export const stored = (repo: SnakeRepo, userId = "u") => repo.games.get("g", DATE, userId);
