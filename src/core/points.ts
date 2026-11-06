import type { PlayerRef, PointsSource, PointsTable } from "./points-types.ts";
import type { BotModule } from "./types.ts";

/** The rows a daily game's leaderboard counts. */
export const FINISHED = "finished_at IS NOT NULL";

/** A source that sums `expr` over the player's rows in `table`. */
export function pointsSource(t: PointsTable): PointsSource {
  const extra = t.where ? ` AND ${t.where}` : "";
  const sql = `SELECT COALESCE(SUM(${t.expr ?? "points"}), 0) AS n FROM ${t.table}
    WHERE guild_id = ? AND ${t.user ?? "user_id"} = ?${extra}`;

  return {
    game: t.game,
    label: t.label,
    earned: (db, who) =>
      db.query<{ n: number }, [string, string]>(sql).get(who.guildId, who.userId)?.n ?? 0,
  };
}

/** Every module's points sources, in module order. */
export const pointsSources = (modules: readonly BotModule[]): PointsSource[] =>
  modules.flatMap((m) => m.points ?? []);

/** What each game gave one player, in source order. */
export function earnedBy(
  sources: readonly PointsSource[],
  db: Parameters<PointsSource["earned"]>[0],
  who: PlayerRef,
): { game: string; label: string; points: number }[] {
  return sources.map((s) => ({ game: s.game, label: s.label, points: s.earned(db, who) }));
}
