import type { Database } from "bun:sqlite";
import type { StoredPuzzle } from "../types.ts";
import { type PuzzleRow, storedJson, toStored } from "./rows.ts";

/** crossword_puzzles: each server puzzle and its clues per date. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string): StoredPuzzle | null {
    const row = this.db
      .query<PuzzleRow, [string, string]>(
        "SELECT puzzle, clues FROM crossword_puzzles WHERE guild_id = ? AND date = ?",
      )
      .get(guildId, date);

    return row ? toStored(row) : null;
  }

  /** A guild's puzzles dated from `from` up to, not including, `before`. */
  since(guildId: string, from: string, before: string): StoredPuzzle[] {
    return this.db
      .query<PuzzleRow, [string, string, string]>(
        "SELECT puzzle, clues FROM crossword_puzzles WHERE guild_id = ? AND date >= ? AND date < ?",
      )
      .all(guildId, from, before)
      .map(toStored);
  }

  /** The stored puzzle: `s` if the date had none, else the one already there. */
  create(guildId: string, date: string, s: StoredPuzzle): StoredPuzzle {
    this.db
      .query(
        "INSERT OR IGNORE INTO crossword_puzzles (guild_id, date, puzzle, clues) VALUES (?, ?, ?, ?)",
      )
      .run(guildId, date, ...storedJson(s));

    return this.get(guildId, date) ?? s;
  }
}
