import { award } from "../scoring.ts";
import type { GridRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";
import { dailyStreak } from "./streak.ts";

/**
 * Scores a completed game; the award is null when it was already finished. While a game is
 * played its points hold the running cell total; finishing replaces it with the final points.
 */
export function finish(repo: GridRepo, g: Game, now: number): { game: Game; award: Award | null } {
  const filled = g.cells.filter((c) => c !== "").length;
  const streak = dailyStreak(repo, g);
  const won = award(g.points ?? 0, filled, streak);
  const game = { ...g, filled, streak, points: won.points, finishedAt: now };

  if (repo.games.save(game)) return { game, award: won };

  return { game: repo.games.get(g.guildId, g.date, g.userId) ?? game, award: null };
}
