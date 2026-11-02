import type { Database } from "bun:sqlite";
import type { Puzzle } from "../types.ts";
import { type PuzzleRow, toPuzzle } from "./rows.ts";

/** duel_puzzles: each server's questions per date, kept as stored JSON. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string): Puzzle | null {
    const row = this.db
      .query<PuzzleRow, [string, string]>(
        "SELECT * FROM duel_puzzles WHERE guild_id = ? AND date = ?",
      )
      .get(guildId, date);

    return row ? toPuzzle(row) : null;
  }

  /** The stored puzzle: `p` if the date had none, else the one already there. */
  create(p: Puzzle): Puzzle {
    this.db
      .query("INSERT OR IGNORE INTO duel_puzzles (guild_id, date, questions) VALUES (?, ?, ?)")
      .run(p.guildId, p.date, JSON.stringify(p.questions));

    return this.get(p.guildId, p.date) ?? p;
  }

  /** Puzzles from before `date`, at most `days` days back. */
  recent(guildId: string, date: string, days: number): Puzzle[] {
    return this.db
      .query<PuzzleRow, [string, string, string, string]>(
        `SELECT * FROM duel_puzzles
         WHERE guild_id = ? AND date < ? AND date >= date(?, '-' || ? || ' days')`,
      )
      .all(guildId, date, date, String(days))
      .map(toPuzzle);
  }
}
