import type { Database } from "bun:sqlite";
import type { Level, Puzzle } from "../types.ts";
import type { PuzzleRow } from "./types.ts";

const toPuzzle = (r: PuzzleRow): Puzzle => ({
  guildId: r.guild_id,
  date: r.date,
  level: r.difficulty,
  givens: r.givens,
  solution: r.solution,
});

/** sudoku_puzzles: each server's board per date and level. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string, level: Level): Puzzle | null {
    const row = this.db
      .query<PuzzleRow, [string, string, string]>(
        "SELECT * FROM sudoku_puzzles WHERE guild_id = ? AND date = ? AND difficulty = ?",
      )
      .get(guildId, date, level);

    return row ? toPuzzle(row) : null;
  }

  /** The stored puzzle: `p` if the slot had none, else the one already there. */
  create(p: Puzzle): Puzzle {
    this.db
      .query(
        `INSERT OR IGNORE INTO sudoku_puzzles (guild_id, date, difficulty, givens, solution)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(p.guildId, p.date, p.level, p.givens, p.solution);

    return this.get(p.guildId, p.date, p.level) ?? p;
  }
}
