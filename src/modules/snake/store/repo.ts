import type { Database } from "bun:sqlite";
import { GameStore } from "./games.ts";
import { PracticeStore } from "./practice.ts";
import { PuzzleStore } from "./puzzles.ts";

/** The snake tables, one store each. */
export class SnakeRepo {
  readonly puzzles: PuzzleStore;
  readonly games: GameStore;
  readonly practice: PracticeStore;

  constructor(db: Database) {
    this.puzzles = new PuzzleStore(db);
    this.games = new GameStore(db);
    this.practice = new PracticeStore(db);
  }
}
