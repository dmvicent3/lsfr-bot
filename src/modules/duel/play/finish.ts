import { award } from "../scoring.ts";
import type { DuelRepo } from "../store/repo.ts";
import type { Award, Game, Puzzle } from "../types.ts";
import { correctCount } from "./answer.ts";
import { dailyStreak } from "./streak.ts";

/** Scores a completed game; the award is null when it was already finished. */
export function finish(
  repo: DuelRepo,
  puzzle: Puzzle,
  g: Game,
  now: number,
): { game: Game; award: Award | null } {
  const correct = correctCount(puzzle, g.answers);
  const streak = dailyStreak(repo, g);
  const won = award(correct, streak);
  const game = { ...g, correct, streak, points: won.points, finishedAt: now };

  if (repo.games.save(game)) return { game, award: won };

  return { game: repo.games.get(g.guildId, g.date, g.userId) ?? game, award: null };
}
