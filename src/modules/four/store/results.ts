import type { Database } from "bun:sqlite";
import type { Difficulty } from "../types.ts";
import type { LevelStats, Standing } from "./types.ts";

interface StatsRow extends LevelStats {
  difficulty: string;
}

const STATS = `SELECT difficulty,
    SUM(result = 'win') AS wins, SUM(result = 'loss') AS losses, SUM(result = 'draw') AS draws,
    MIN(CASE WHEN result = 'win' THEN moves END) AS best
  FROM four_results WHERE guild_id = ? AND player_id = ? GROUP BY difficulty`;

const STANDINGS = `SELECT player_id AS userId,
    SUM(CASE difficulty WHEN 'hard' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END) AS points,
    COUNT(*) AS wins
  FROM four_results WHERE guild_id = ? AND result = 'win' AND ended_at >= ? AND ended_at < ?
  GROUP BY player_id ORDER BY points DESC, SUM(moves), player_id`;

const none = (): LevelStats => ({ wins: 0, losses: 0, draws: 0, best: null });

/** four_results: one row per finished game; stats and leaderboards come from here. */
export class ResultStore {
  constructor(private readonly db: Database) {}

  stats(guildId: string, playerId: string): Record<Difficulty, LevelStats> {
    const out: Record<Difficulty, LevelStats> = { easy: none(), normal: none(), hard: none() };
    const rows = this.db.query<StatsRow, [string, string]>(STATS).all(guildId, playerId);

    for (const { difficulty, ...s } of rows) {
      if (difficulty === "easy" || difficulty === "normal" || difficulty === "hard") {
        out[difficulty] = s;
      }
    }

    return out;
  }

  /** Points per player for wins from `from` up to (not including) `to`. */
  standings(guildId: string, from: number, to: number): Standing[] {
    return this.db.query<Standing, [string, number, number]>(STANDINGS).all(guildId, from, to);
  }
}
