import { streakOf } from "../../../core/daily.ts";
import { award } from "../scoring.ts";
import type { CrosswordRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";

/**
 * Scores a finished daily in one guarded write; the award is null when it was already
 * finished (then the stored game is returned).
 */
export function finish(
  repo: CrosswordRepo,
  g: Game,
  solved: boolean,
  now: number,
): { game: Game; award: Award | null } {
  const streak = streakOf(repo.games, g);
  const won = award(solved, g.wrong, g.reveals, streak);
  const game = { ...g, solved, streak, points: won.points, finishedAt: now };

  if (repo.games.finish(game)) return { game, award: won };

  return { game: repo.games.get(g.guildId, g.date, g.userId) ?? game, award: null };
}
