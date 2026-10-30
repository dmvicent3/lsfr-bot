import type { Database } from "bun:sqlite";
import { fromBoard, toBoard } from "../board.ts";
import { playerMoves } from "../game.ts";
import type { Difficulty, Game } from "../types.ts";
import type { Finish, GameRow } from "./types.ts";

const LEVELS: Record<string, Difficulty> = { easy: "easy", normal: "normal", hard: "hard" };

const toGame = (r: GameRow): Game => ({
  guildId: r.guild_id,
  playerId: r.player_id,
  channelId: r.channel_id,
  messageId: r.message_id,
  board: toBoard(r.board),
  first: r.first === "jevos" ? "jevos" : "player",
  difficulty: LEVELS[r.difficulty] ?? "normal",
  startedAt: r.started_at,
  updatedAt: r.updated_at,
});

/** four_games: each player's live game, at most one per server. */
export class GameStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, playerId: string): Game | null {
    const row = this.db
      .query<GameRow, [string, string]>(
        "SELECT * FROM four_games WHERE guild_id = ? AND player_id = ?",
      )
      .get(guildId, playerId);

    return row ? toGame(row) : null;
  }

  byMessage(messageId: string): Game | null {
    const row = this.db
      .query<GameRow, [string]>("SELECT * FROM four_games WHERE message_id = ?")
      .get(messageId);

    return row ? toGame(row) : null;
  }

  put(g: Game): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO four_games (guild_id, player_id, channel_id, message_id, board,
           first, difficulty, started_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        g.guildId,
        g.playerId,
        g.channelId,
        g.messageId,
        fromBoard(g.board),
        g.first,
        g.difficulty,
        g.startedAt,
        g.updatedAt,
      );
  }

  remove(guildId: string, playerId: string): number {
    return this.db
      .query("DELETE FROM four_games WHERE guild_id = ? AND player_id = ?")
      .run(guildId, playerId).changes;
  }

  /** Ends the game and records its result, once: false when it had already ended. */
  finish(g: Game, f: Finish): boolean {
    return this.db.transaction(() => {
      if (this.remove(g.guildId, g.playerId) !== 1) return false;

      this.db
        .query(
          `INSERT INTO four_results (guild_id, player_id, difficulty, result, how, moves, ended_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(g.guildId, g.playerId, g.difficulty, f.result, f.how, playerMoves(g), f.endedAt);

      return true;
    })();
  }
}
