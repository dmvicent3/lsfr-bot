import type { Database } from "bun:sqlite";
import type { Puzzle } from "../types.ts";
import type { PuzzleRow } from "./types.ts";

const toPuzzle = (r: PuzzleRow): Puzzle => ({
  guildId: r.guild_id,
  date: r.date,
  word: r.word,
  length: r.length,
});

/** word_puzzles: each server's word per date. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string): Puzzle | null {
    const row = this.db
      .query<PuzzleRow, [string, string]>(
        "SELECT * FROM word_puzzles WHERE guild_id = ? AND date = ?",
      )
      .get(guildId, date);

    return row ? toPuzzle(row) : null;
  }

  /** The stored puzzle: `p` if the date had none, else the one already there. */
  create(p: Puzzle): Puzzle {
    this.db
      .query(
        "INSERT OR IGNORE INTO word_puzzles (guild_id, date, word, length) VALUES (?, ?, ?, ?)",
      )
      .run(p.guildId, p.date, p.word, p.length);

    return this.get(p.guildId, p.date) ?? p;
  }

  usedWords(guildId: string): Set<string> {
    const rows = this.db
      .query<{ word: string }, [string]>("SELECT word FROM word_puzzles WHERE guild_id = ?")
      .all(guildId);

    return new Set(rows.map((r) => r.word));
  }
}
