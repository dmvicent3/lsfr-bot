import type { SnakeRepo } from "../store/repo.ts";
import type { Practice } from "../types.ts";
import type { Make } from "./types.ts";

interface Opening {
  guildId: string;
  userId: string;
  now: number;
}

/** Starts a fresh practice round, dropping the kept one; null (nothing stored) when none is picked. */
export function newPractice(repo: SnakeRepo, v: Opening, make: Make): Practice | null {
  const answer = make();

  if (!answer) return null;

  const round: Practice = {
    guildId: v.guildId,
    userId: v.userId,
    answer,
    guesses: [],
    startedAt: v.now,
    finishedAt: null,
  };

  repo.practice.replace(round);

  return round;
}

/** The kept round, else a new one. */
export const openPractice = (repo: SnakeRepo, v: Opening, make: Make): Practice | null =>
  repo.practice.get(v.guildId, v.userId) ?? newPractice(repo, v, make);
