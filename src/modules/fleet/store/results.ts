import type { Database } from "bun:sqlite";
import type { Difficulty } from "../types.ts";
import type { FleetStats, LevelStats, Standing } from "./types.ts";

interface LevelRow extends LevelStats {
  difficulty: string;
}

interface TotalsRow {
  shots: number | null;
  hits: number | null;
  resigned: number | null;
  abandoned: number | null;
}

const LEVELS = `SELECT difficulty,
    SUM(result = 'win') AS wins, SUM(result = 'loss') AS losses,
    MIN(CASE WHEN result = 'win' THEN shots END) AS best
  FROM fleet_results WHERE guild_id = ? AND player_id = ? GROUP BY difficulty`;

const TOTALS = `SELECT SUM(shots) AS shots, SUM(hits) AS hits,
    SUM(how = 'resigned') AS resigned, SUM(how = 'abandoned') AS abandoned
  FROM fleet_results WHERE guild_id = ? AND player_id = ?`;

const STANDINGS = `SELECT player_id AS userId,
    SUM(CASE difficulty WHEN 'hard' THEN 3 WHEN 'normal' THEN 2 ELSE 1 END) AS points,
    COUNT(*) AS wins
  FROM fleet_results WHERE guild_id = ? AND result = 'win' AND ended_at >= ? AND ended_at < ?
  GROUP BY player_id ORDER BY points DESC, SUM(shots), player_id`;

const none = (): LevelStats => ({ wins: 0, losses: 0, best: null });

const isLevel = (s: string): s is Difficulty => s === "easy" || s === "normal" || s === "hard";

const totals = (t: TotalsRow | null): Omit<FleetStats, "levels"> => ({
  shots: t?.shots ?? 0,
  hits: t?.hits ?? 0,
  resigned: t?.resigned ?? 0,
  abandoned: t?.abandoned ?? 0,
});

/** fleet_results: one row per finished game; stats and leaderboards come from here. */
export class ResultStore {
  constructor(private readonly db: Database) {}

  stats(guildId: string, playerId: string): FleetStats {
    const levels: Record<Difficulty, LevelStats> = { easy: none(), normal: none(), hard: none() };

    for (const { difficulty, ...s } of this.db
      .query<LevelRow, [string, string]>(LEVELS)
      .all(guildId, playerId)) {
      if (isLevel(difficulty)) levels[difficulty] = s;
    }

    const t = this.db.query<TotalsRow, [string, string]>(TOTALS).get(guildId, playerId);

    return { levels, ...totals(t) };
  }

  /** Points per player for wins from `from` up to (not including) `to`. */
  standings(guildId: string, from: number, to: number): Standing[] {
    return this.db.query<Standing, [string, number, number]>(STANDINGS).all(guildId, from, to);
  }
}
