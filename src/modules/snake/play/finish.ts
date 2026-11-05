import { nextStreak } from "../../../core/daily.ts";
import { award } from "../scoring.ts";
import type { SnakeRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";

/** The streak after `g`: a solve extends a solve from the day before, a give-up resets it. */
function streakAfter(repo: SnakeRepo, g: Game, solved: boolean): number {
  const last = repo.games.lastFinishedBefore(g.guildId, g.userId, g.date);
  const prev = last
    ? { date: last.date, won: last.solved === true, streak: last.streak ?? 0 }
    : null;

  return nextStreak(prev, g.date, solved);
}

/**
 * Scores a finished daily in one guarded write; the award is null when it was already
 * finished (then the stored game is returned).
 */
export function finish(
  repo: SnakeRepo,
  g: Game,
  solved: boolean,
  now: number,
): { game: Game; award: Award | null } {
  const streak = streakAfter(repo, g, solved);
  const won = award(solved, g.guesses.length, streak);
  const game = { ...g, solved, streak, points: won.points, finishedAt: now };

  if (repo.games.finish(game)) return { game, award: won };

  return { game: repo.games.get(g.guildId, g.date, g.userId) ?? game, award: null };
}
