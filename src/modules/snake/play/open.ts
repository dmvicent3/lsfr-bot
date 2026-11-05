import type { SnakeRepo } from "../store/repo.ts";
import type { Game } from "../types.ts";
import type { Make } from "./types.ts";

interface Opening {
  guildId: string;
  userId: string;
  date: string;
  now: number;
}

/**
 * The day's answer (picked on first open) and this player's game; null when no answer could be
 * picked, in which case nothing is stored.
 */
export function openDaily(
  repo: SnakeRepo,
  v: Opening,
  make: Make,
): { answer: string; game: Game } | null {
  const { guildId, date } = v;
  const picked = repo.puzzles.get(guildId, date) ?? make();

  if (!picked) return null;

  const answer = repo.puzzles.create(guildId, date, picked);
  const game = repo.games.start({
    guildId,
    date,
    userId: v.userId,
    guesses: [],
    solved: null,
    points: null,
    streak: null,
    startedAt: v.now,
    finishedAt: null,
  });

  return { answer, game };
}
