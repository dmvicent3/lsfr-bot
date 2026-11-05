import type { Database } from "bun:sqlite";

interface AnswerRow {
  answer: string;
}

/** snake_puzzles: each server's answer per date. */
export class PuzzleStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, date: string): string | null {
    const row = this.db
      .query<AnswerRow, [string, string]>(
        "SELECT answer FROM snake_puzzles WHERE guild_id = ? AND date = ?",
      )
      .get(guildId, date);

    return row?.answer ?? null;
  }

  /** A guild's answers dated from `from` up to, not including, `before`. */
  since(guildId: string, from: string, before: string): string[] {
    return this.db
      .query<AnswerRow, [string, string, string]>(
        "SELECT answer FROM snake_puzzles WHERE guild_id = ? AND date >= ? AND date < ?",
      )
      .all(guildId, from, before)
      .map((r) => r.answer);
  }

  /** The stored answer: `answer` if the date had none, else the one already there. */
  create(guildId: string, date: string, answer: string): string {
    this.db
      .query("INSERT OR IGNORE INTO snake_puzzles (guild_id, date, answer) VALUES (?, ?, ?)")
      .run(guildId, date, answer);

    return this.get(guildId, date) ?? answer;
  }
}
