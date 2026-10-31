import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import { fleetMigrations } from "../../../../src/modules/fleet/store/migrations.ts";
import { FleetRepo } from "../../../../src/modules/fleet/store/repo.ts";
import type { Difficulty, Game } from "../../../../src/modules/fleet/types.ts";
import { playing, rowsFleet } from "../fixtures.ts";

export function repo(): { db: Database; repo: FleetRepo } {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, fleetMigrations);

  return { db, repo: new FleetRepo(db) };
}

const SHIP_CELLS = rowsFleet().flatMap((s) => s.cells);

/** Cells in rows 2, 4, 6, 8 and 10: never a `rowsFleet` ship. */
const WATER = Array.from({ length: 100 }, (_, i) => i).filter((i) => Math.floor(i / 10) % 2 === 1);

/** A game of `playerId` whose player fired `shots` times, `hits` of them on jevos's ships. */
export function shotGame(
  playerId: string,
  p: { shots: number; hits: number; difficulty: Difficulty },
): Game {
  const shots = [...SHIP_CELLS.slice(0, p.hits), ...WATER.slice(0, p.shots - p.hits)];

  return playing({
    playerId,
    messageId: `m-${playerId}`,
    difficulty: p.difficulty,
    player: { ships: rowsFleet(), shots },
  });
}
