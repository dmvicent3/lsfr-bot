import type { GroupsRepo } from "../store/repo.ts";
import type { Practice } from "../types.ts";
import { freshProgress } from "./open.ts";
import type { Make } from "./types.ts";

interface Opening {
  guildId: string;
  userId: string;
  now: number;
}

/** Starts a fresh practice round, dropping the kept one; null (nothing stored) when none builds. */
export function newPractice(repo: GroupsRepo, v: Opening, make: Make): Practice | null {
  const puzzle = make();

  if (!puzzle) return null;

  const round: Practice = {
    guildId: v.guildId,
    userId: v.userId,
    puzzle,
    ...freshProgress(puzzle),
    startedAt: v.now,
    finishedAt: null,
  };

  repo.practice.replace(round);

  return round;
}

/** The kept round, else a new one. */
export const openPractice = (repo: GroupsRepo, v: Opening, make: Make): Practice | null =>
  repo.practice.get(v.guildId, v.userId) ?? newPractice(repo, v, make);
