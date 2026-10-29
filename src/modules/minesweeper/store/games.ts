import type { Database } from "bun:sqlite";
import type { FinishedRow, Game, NewGame } from "../types.ts";
import { cellsText, fieldText, toFinished, toGame } from "./rows.ts";
import type { FinishedDbRow, GameRow } from "./types.ts";

/** minesweeper_games: every game; a player's live one has finished_at NULL. */
export class GameStore {
  constructor(private readonly db: Database) {}

  insert(g: NewGame): Game {
    const { lastInsertRowid } = this.db
      .query(
        `INSERT INTO minesweeper_games
           (guild_id, channel_id, message_id, player_id, width, height, mines, field, cells,
            cursor, hit, created_at, started_at, finished_at, result, controls)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        g.guildId,
        g.channelId,
        g.messageId,
        g.playerId,
        g.width,
        g.height,
        g.mines,
        fieldText(g.field),
        cellsText(g.cells),
        g.cursor,
        g.hit,
        g.createdAt,
        g.startedAt,
        g.finishedAt,
        g.result,
        g.controls,
      );

    return { ...g, id: Number(lastInsertRowid) };
  }

  live(guildId: string, playerId: string): Game | null {
    const row = this.db
      .query<GameRow, [string, string]>(
        `SELECT * FROM minesweeper_games
         WHERE guild_id = ? AND player_id = ? AND finished_at IS NULL`,
      )
      .get(guildId, playerId);

    return row ? toGame(row) : null;
  }

  byMessage(messageId: string): Game | null {
    const row = this.db
      .query<GameRow, [string]>("SELECT * FROM minesweeper_games WHERE message_id = ?")
      .get(messageId);

    return row ? toGame(row) : null;
  }

  /** Writes a move or a finish; false when the game had already finished, so nothing changed. */
  save(g: Game): boolean {
    const { changes } = this.db
      .query(
        `UPDATE minesweeper_games
         SET field = ?, cells = ?, cursor = ?, hit = ?, started_at = ?, finished_at = ?, result = ?
         WHERE id = ? AND finished_at IS NULL`,
      )
      .run(
        fieldText(g.field),
        cellsText(g.cells),
        g.cursor,
        g.hit,
        g.startedAt,
        g.finishedAt,
        g.result,
        g.id,
      );

    return changes === 1;
  }

  remove(id: number): void {
    this.db.query("DELETE FROM minesweeper_games WHERE id = ?").run(id);
  }

  /** A player's finished games that had begun, oldest first. */
  finished(guildId: string, playerId: string): FinishedRow[] {
    return this.db
      .query<FinishedDbRow, [string, string]>(
        `SELECT width, height, mines, result, started_at, finished_at FROM minesweeper_games
         WHERE guild_id = ? AND player_id = ? AND finished_at IS NOT NULL
           AND started_at IS NOT NULL
         ORDER BY finished_at, id`,
      )
      .all(guildId, playerId)
      .map(toFinished);
  }
}
