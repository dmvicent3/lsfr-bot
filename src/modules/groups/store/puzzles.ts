import type { Database } from "bun:sqlite";
import type { Puzzle } from "../types.ts";

interface PuzzleRow {
  puzzle: string;
}

const toPuzzle = (r: PuzzleRow): Puzzle => JSON.parse(r.puzzle);

/** groups_puzzles: each server's puzzle per date. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string): Puzzle | null {
    const row = this.db
      .query<PuzzleRow, [string, string]>(
        "SELECT puzzle FROM groups_puzzles WHERE guild_id = ? AND date = ?",
      )
      .get(guildId, date);

    return row ? toPuzzle(row) : null;
  }

  /** A guild's puzzles dated from `from` up to, not including, `before`. */
  since(guildId: string, from: string, before: string): Puzzle[] {
    return this.db
      .query<PuzzleRow, [string, string, string]>(
        "SELECT puzzle FROM groups_puzzles WHERE guild_id = ? AND date >= ? AND date < ?",
      )
      .all(guildId, from, before)
      .map(toPuzzle);
  }

  /** The stored puzzle: `p` if the date had none, else the one already there. */
  create(guildId: string, date: string, p: Puzzle): Puzzle {
    this.db
      .query("INSERT OR IGNORE INTO groups_puzzles (guild_id, date, puzzle) VALUES (?, ?, ?)")
      .run(guildId, date, JSON.stringify(p));

    return this.get(guildId, date) ?? p;
  }
}
