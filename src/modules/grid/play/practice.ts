import type { Snapshot } from "../../../core/countries/types.ts";
import { generateGrid } from "../generate/generate.ts";
import type { GridRepo } from "../store/repo.ts";
import type { Practice } from "../types.ts";

interface Opening {
  guildId: string;
  userId: string;
  now: number;
  snapshot: Snapshot;
}

/** Starts a fresh practice round; null (nothing stored) when no grid could be generated. */
export function newPractice(repo: GridRepo, v: Opening, random: () => number): Practice | null {
  const grid = generateGrid({ snapshot: v.snapshot, random, avoid: [] });

  if (!grid) return null;

  const round: Practice = {
    guildId: v.guildId,
    userId: v.userId,
    grid,
    cells: Array.from({ length: 9 }, () => ""),
    guesses: 0,
    lastMiss: null,
    points: 0,
    startedAt: v.now,
    finishedAt: null,
  };

  repo.practice.replace(round);

  return round;
}

/** The kept round of the player, or a new one when there is none. */
export const openPractice = (repo: GridRepo, v: Opening, random: () => number): Practice | null =>
  repo.practice.get(v.guildId, v.userId) ?? newPractice(repo, v, random);
