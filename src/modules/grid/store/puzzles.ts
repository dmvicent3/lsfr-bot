import type { Database } from "bun:sqlite";
import { previousDate } from "../../../core/daily.ts";
import type { Puzzle } from "../types.ts";
import { gridJson, type PuzzleRow, toPuzzle } from "./rows.ts";

/** grid_puzzles: each server's grid per date. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string): Puzzle | null {
    const row = this.db
      .query<PuzzleRow, [string, string]>(
        "SELECT * FROM grid_puzzles WHERE guild_id = ? AND date = ?",
      )
      .get(guildId, date);

    return row ? toPuzzle(row) : null;
  }

  /** The stored puzzle: `p` if the date had none, else the one already there. */
  create(p: Puzzle): Puzzle {
    this.db
      .query(
        "INSERT OR IGNORE INTO grid_puzzles (guild_id, date, rows, cols, answers) VALUES (?, ?, ?, ?, ?)",
      )
      .run(p.guildId, p.date, ...gridJson(p.grid));

    return this.get(p.guildId, p.date) ?? p;
  }

  /** Yesterday's puzzle, whose rules the next grid avoids. */
  previous(guildId: string, date: string): Puzzle | null {
    return this.get(guildId, previousDate(date));
  }
}
