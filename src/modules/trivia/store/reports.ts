import type { Database } from "bun:sqlite";
import type { Report } from "./types.ts";

/** trivia_reports: questions or lists players flagged. */
export class ReportStore {
  constructor(private readonly db: Database) {}

  add(r: Report): void {
    this.db
      .query(
        "INSERT INTO trivia_reports (guild_id, kind, item_id, user_id, reason, at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(r.guildId, r.kind, r.itemId, r.userId, r.reason, r.at);
  }

  /** Newest first. */
  open(guildId: string): Report[] {
    return this.db
      .query<Report, [string]>(
        `SELECT guild_id AS guildId, kind, item_id AS itemId, user_id AS userId, reason, at
         FROM trivia_reports WHERE guild_id = ? ORDER BY at DESC, id DESC`,
      )
      .all(guildId);
  }
}
