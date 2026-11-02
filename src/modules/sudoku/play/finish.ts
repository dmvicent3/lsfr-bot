import { award } from "../scoring.ts";
import type { SudokuRepo } from "../store/repo.ts";
import type { Award, Game } from "../types.ts";
import { dailyStreak } from "./streak.ts";

/** Marks `g` solved; the award is null for practice or when it was already solved. */
export function finish(
  repo: SudokuRepo,
  g: Game,
  now: number,
): { game: Game; award: Award | null } {
  if (g.kind === "practice") {
    const game = { ...g, solvedAt: now };
    repo.games.save(game);

    return { game, award: null };
  }

  const streak = dailyStreak(repo, g);
  const won = award(g.level, g.checks, streak);
  const game = { ...g, solvedAt: now, streak, points: won.points };

  if (repo.games.save(game)) return { game, award: won };

  return { game: repo.games.get(g) ?? game, award: null };
}
