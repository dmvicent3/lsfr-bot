import type { Database } from "bun:sqlite";
import { GameStore } from "./games.ts";
import { PlaceStore } from "./places.ts";

/** The shed tables, one store each. */
export class ShedRepo {
  readonly games: GameStore;
  readonly places: PlaceStore;

  constructor(db: Database) {
    this.games = new GameStore(db);
    this.places = new PlaceStore(db);
  }
}
