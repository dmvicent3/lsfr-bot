import type { Database } from "bun:sqlite";
import { Database as Db } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { STALE } from "../../../../src/modules/crossword/components/guard.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import { emptyCells, solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { crosswordMigrations } from "../../../../src/modules/crossword/store/migrations.ts";
import { CrosswordRepo } from "../../../../src/modules/crossword/store/repo.ts";
import type { Game, Practice } from "../../../../src/modules/crossword/types.ts";
import { slotKey } from "../../../../src/modules/crossword/render/ids.ts";
import { game, practice } from "../store/fixtures.ts";
import { square, storedSquare } from "../play/fixtures.ts";

export const DATE = "2026-11-04";
export { STALE };

/** The square's cells with the given indices left empty. */
export function missing(...empty: number[]): string {
  return solutionOf(square())
    .split("")
    .map((c, i) => (empty.includes(i) ? "." : c))
    .join("");
}

export const keyOf = (slot: number): string => slotKey(square().slots[slot]!);

/** A database with today's square puzzle and, unless null, the player's game or practice round. */
export function setup(over: Partial<Game> | null = {}, round: Partial<Practice> | null = null) {
  const db: Database = new Db(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...crosswordMigrations]);
  const repo = new CrosswordRepo(db);
  repo.puzzles.create("g", DATE, storedSquare());

  if (over) repo.games.start(game({ date: DATE, cells: emptyCells(square()), ...over }));

  if (round) {
    repo.practice.replace(practice({ ...storedSquare(), cells: emptyCells(square()), ...round }));
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  return { db, repo, ctx: { db } as unknown as Ctx };
}

export const stored = (repo: CrosswordRepo, userId = "u") => repo.games.get("g", DATE, userId);
