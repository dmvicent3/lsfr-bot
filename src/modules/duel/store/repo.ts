import type { Database } from "bun:sqlite";
import { GameStore } from "./games.ts";
import { PuzzleStore } from "./puzzles.ts";

/** The duel tables, one store each. */
export class DuelRepo {
  readonly puzzles: PuzzleStore;
  readonly games: GameStore;

  constructor(db: Database) {
    this.puzzles = new PuzzleStore(db);
    this.games = new GameStore(db);
  }
}
