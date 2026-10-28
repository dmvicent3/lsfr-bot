import type { Database } from "bun:sqlite";
import { GameStore } from "./games.ts";
import { PuzzleStore } from "./puzzles.ts";

/** The word tables, one store each. */
export class WordRepo {
  readonly puzzles: PuzzleStore;
  readonly games: GameStore;

  constructor(db: Database) {
    this.puzzles = new PuzzleStore(db);
    this.games = new GameStore(db);
  }
}
