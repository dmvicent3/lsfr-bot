import type { GroupsRepo } from "../store/repo.ts";
import type { Game, Progress, Puzzle } from "../types.ts";
import type { Make } from "./types.ts";

interface Opening {
  guildId: string;
  userId: string;
  date: string;
  now: number;
}

/** A round's starting progress on a puzzle: its order, nothing picked or found. */
export const freshProgress = (p: Puzzle): Progress => ({
  order: p.order,
  picked: "",
  found: "",
  guesses: "",
  mistakes: 0,
  lastLine: null,
});

/**
 * The day's puzzle (built on first open) and this player's game; null when no puzzle could be
 * built, in which case nothing is stored.
 */
export function openDaily(
  repo: GroupsRepo,
  v: Opening,
  make: Make,
): { puzzle: Puzzle; game: Game } | null {
  const { guildId, date } = v;
  const built = repo.puzzles.get(guildId, date) ?? make();

  if (!built) return null;

  const puzzle = repo.puzzles.create(guildId, date, built);
  const game = repo.games.start({
    guildId,
    date,
    userId: v.userId,
    ...freshProgress(puzzle),
    solved: null,
    points: null,
    streak: null,
    startedAt: v.now,
    finishedAt: null,
  });

  return { puzzle, game };
}
