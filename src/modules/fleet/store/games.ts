import type { Database } from "bun:sqlite";
import { playerShots } from "../game.ts";
import { hits } from "../shots.ts";
import type { Difficulty, Game } from "../types.ts";
import { decodeState, encodeState } from "./state.ts";
import type { Finish, GameRow } from "./types.ts";

const LEVELS: Record<string, Difficulty> = { easy: "easy", normal: "normal", hard: "hard" };

function toGame(r: GameRow | null): Game | null {
  const state = r ? decodeState(r.state) : null;

  if (!r || !state) return null;

  return {
    guildId: r.guild_id,
    playerId: r.player_id,
    channelId: r.channel_id,
    messageId: r.message_id,
    fleetMessageId: r.fleet_message_id,
    difficulty: LEVELS[r.difficulty] ?? "normal",
    ...state,
    startedAt: r.started_at,
    updatedAt: r.updated_at,
  };
}

/** fleet_games: each player's live game, at most one per server. */
export class GameStore {
  constructor(private readonly db: Database) {}

  get(guildId: string, playerId: string): Game | null {
    const sql = "SELECT * FROM fleet_games WHERE guild_id = ? AND player_id = ?";

    return toGame(this.db.query<GameRow, [string, string]>(sql).get(guildId, playerId));
  }

  byMessage(messageId: string): Game | null {
    const sql = "SELECT * FROM fleet_games WHERE message_id = ?";

    return toGame(this.db.query<GameRow, [string]>(sql).get(messageId));
  }

  put(g: Game): void {
    this.db
      .query(
        `INSERT OR REPLACE INTO fleet_games (guild_id, player_id, channel_id, message_id,
           fleet_message_id, difficulty, state, started_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        g.guildId,
        g.playerId,
        g.channelId,
        g.messageId,
        g.fleetMessageId,
        g.difficulty,
        encodeState(g),
        g.startedAt,
        g.updatedAt,
      );
  }

  remove(guildId: string, playerId: string): number {
    return this.db
      .query("DELETE FROM fleet_games WHERE guild_id = ? AND player_id = ?")
      .run(guildId, playerId).changes;
  }

  /**
   * Ends the game, once: false when it had already ended. Records a result only when the player
   * fired at least one shot.
   */
  finish(g: Game, f: Finish): boolean {
    return this.db.transaction(() => {
      if (this.remove(g.guildId, g.playerId) !== 1) return false;

      if (playerShots(g) === 0) return true;

      this.db
        .query(
          `INSERT INTO fleet_results (guild_id, player_id, difficulty, result, how, shots, hits,
             ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          g.guildId,
          g.playerId,
          g.difficulty,
          f.result,
          f.how,
          playerShots(g),
          hits(g.jevos.ships, g.player.shots),
          f.endedAt,
        );

      return true;
    })();
  }
}
