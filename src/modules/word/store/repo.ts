import type { Database } from "bun:sqlite";
import { GameStore } from "./games.ts";
import { MultiGameStore } from "./multi-games.ts";
import { MultiPuzzleStore } from "./multi-puzzles.ts";
import { PuzzleStore } from "./puzzles.ts";

/** The word tables, one store each; the multi ones hold Duo and Quad. */
export class WordRepo {
  readonly puzzles: PuzzleStore;
  readonly games: GameStore;
  readonly multiPuzzles: MultiPuzzleStore;
  readonly multiGames: MultiGameStore;

  constructor(db: Database) {
    this.puzzles = new PuzzleStore(db);
    this.games = new GameStore(db);
    this.multiPuzzles = new MultiPuzzleStore(db);
    this.multiGames = new MultiGameStore(db);
  }
}
