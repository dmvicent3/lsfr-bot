import type { Database } from "bun:sqlite";
import type { Mode, MultiPuzzle } from "../multi/types.ts";
import type { MultiPuzzleRow } from "./types.ts";

const toPuzzle =
  (mode: Mode) =>
  (r: MultiPuzzleRow): MultiPuzzle => ({
    guildId: r.guild_id,
    mode,
    date: r.date,
    words: r.words.split(","),
    length: r.length,
  });

/** word_multi_puzzles: each server's words per mode and date. */
export class MultiPuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, mode: Mode, date: string): MultiPuzzle | null {
    const row = this.db
      .query<MultiPuzzleRow, [string, string, string]>(
        "SELECT * FROM word_multi_puzzles WHERE guild_id = ? AND mode = ? AND date = ?",
      )
      .get(guildId, mode, date);

    return row ? toPuzzle(mode)(row) : null;
  }

  /** The stored puzzle: `p` if the mode and date had none, else the one already there. */
  create(p: MultiPuzzle): MultiPuzzle {
    this.db
      .query(
        `INSERT OR IGNORE INTO word_multi_puzzles (guild_id, mode, date, words, length)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(p.guildId, p.mode, p.date, p.words.join(","), p.length);

    return this.get(p.guildId, p.mode, p.date) ?? p;
  }

  /** Every word any mode has had in the server. */
  usedWords(guildId: string): Set<string> {
    const rows = this.db
      .query<{ words: string }, [string]>("SELECT words FROM word_multi_puzzles WHERE guild_id = ?")
      .all(guildId);

    return new Set(rows.flatMap((r) => r.words.split(",")));
  }
}
