import type { Database } from "bun:sqlite";
import { GameStore } from "./games.ts";
import { ResultStore } from "./results.ts";

/** The fleet tables, one store each. */
export class FleetRepo {
  readonly games: GameStore;
  readonly results: ResultStore;

  constructor(db: Database) {
    this.games = new GameStore(db);
    this.results = new ResultStore(db);
  }
}
