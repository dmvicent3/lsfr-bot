import type { CrosswordRepo } from "../store/repo.ts";
import type { Practice, Size } from "../types.ts";
import { emptyCells } from "./cells.ts";
import type { Make } from "./make.ts";

interface Opening {
  guildId: string;
  userId: string;
  now: number;
}

/** Starts a fresh practice round, dropping the kept one; null (nothing stored) when none builds. */
export async function newPractice(
  repo: CrosswordRepo,
  v: Opening,
  make: Make,
): Promise<Practice | null> {
  const built = await make();

  if (!built) return null;

  const round: Practice = {
    guildId: v.guildId,
    userId: v.userId,
    ...built,
    cells: emptyCells(built.puzzle),
    wrong: 0,
    reveals: 0,
    lastLine: null,
    startedAt: v.now,
    finishedAt: null,
  };

  repo.practice.replace(round);

  return round;
}

/** The kept round when it has this size, else a new one. */
export async function openPractice(
  repo: CrosswordRepo,
  v: Opening,
  size: Size,
  make: Make,
): Promise<Practice | null> {
  const kept = repo.practice.get(v.guildId, v.userId);

  return kept?.puzzle.size === size ? kept : newPractice(repo, v, make);
}
