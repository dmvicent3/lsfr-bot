import type { Database } from "bun:sqlite";
import { CustomStore } from "./custom.ts";
import { GameStore } from "./games.ts";
import { WinStore } from "./wins.ts";

/** The cards tables, one store each. */
export class CardsRepo {
  readonly custom: CustomStore;
  readonly games: GameStore;
  readonly wins: WinStore;

  constructor(db: Database) {
    this.custom = new CustomStore(db);
    this.games = new GameStore(db);
    this.wins = new WinStore(db);
  }
}
