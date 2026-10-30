import type { Database } from "bun:sqlite";
import type { ButtonPickRow } from "./types.ts";

/** trivia_button_picks: every pick in a closed button round, right or not. */
export class ButtonPickStore {
  constructor(private readonly db: Database) {}

  add(rows: ButtonPickRow[]): void {
    const insert = this.db.query(
      "INSERT INTO trivia_button_picks (guild_id, user_id, question_id, right, at) VALUES (?, ?, ?, ?, ?)",
    );
    this.db.transaction(() => {
      for (const r of rows) insert.run(r.guildId, r.userId, r.questionId, r.right ? 1 : 0, r.at);
    })();
  }

  tally(guildId: string, userId: string): { right: number; played: number } {
    const row = this.db
      .query<{ right: number; played: number }, [string, string]>(
        `SELECT COALESCE(SUM(right), 0) AS right, COUNT(*) AS played
         FROM trivia_button_picks WHERE guild_id = ? AND user_id = ?`,
      )
      .get(guildId, userId);

    return row ?? { right: 0, played: 0 };
  }
}
