import type { Database } from "bun:sqlite";
import type { Board, Cell, Game, Mark } from "../types.ts";
import type { GameRow } from "./types.ts";

const CELLS: Record<string, Cell> = { "-": null, X: "X", O: "O" };

const toBoard = (text: string): Board => text.split("").map((c) => CELLS[c] ?? null);

const fromBoard = (board: Board): string => board.map((c) => c ?? "-").join("");

const toMark = (text: string): Mark => (text === "X" ? "X" : "O");

const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  channelId: r.channel_id,
  messageId: r.message_id,
  playerId: r.player_id,
  board: toBoard(r.board),
  jevosMark: toMark(r.jevos_mark),
  updatedAt: r.updated_at,
});

/** tictactoe_games: the live game of each server, at most one. */
export class GameStore {
  constructor(private readonly db: Database) {}

  get(guildId: string): Game | null {
    const row = this.db
      .query<GameRow, [string]>("SELECT * FROM tictactoe_games WHERE guild_id = ?")
      .get(guildId);

    return row ? toGame(row) : null;
  }

  put(g: Game): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO tictactoe_games
           (guild_id, channel_id, message_id, player_id, board, jevos_mark, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        g.guildId,
        g.channelId,
        g.messageId,
        g.playerId,
        fromBoard(g.board),
        g.jevosMark,
        g.updatedAt,
      );
  }

  remove(guildId: string): void {
    this.db.query("DELETE FROM tictactoe_games WHERE guild_id = ?").run(guildId);
  }
}
