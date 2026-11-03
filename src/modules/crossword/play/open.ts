import type { CrosswordRepo } from "../store/repo.ts";
import type { Game, StoredPuzzle } from "../types.ts";
import { emptyCells } from "./cells.ts";
import type { Make } from "./make.ts";

interface Opening {
  guildId: string;
  userId: string;
  date: string;
  now: number;
}

/**
 * The day puzzle (built on first open) and this player game; null when no puzzle could be
 * built, in which case nothing is stored.
 */
export async function openDaily(
  repo: CrosswordRepo,
  v: Opening,
  make: Make,
): Promise<{ puzzle: StoredPuzzle; game: Game } | null> {
  const { guildId, date } = v;
  const puzzle = repo.puzzles.get(guildId, date) ?? (await make());

  if (!puzzle) return null;

  const stored = repo.puzzles.create(guildId, date, puzzle);
  const game = repo.games.start({
    guildId,
    date,
    userId: v.userId,
    cells: emptyCells(stored.puzzle),
    wrong: 0,
    reveals: 0,
    lastLine: null,
    solved: null,
    points: null,
    streak: null,
    startedAt: v.now,
    finishedAt: null,
  });

  return { puzzle: stored, game };
}
