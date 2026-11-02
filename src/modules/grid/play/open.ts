import type { Snapshot } from "../../../core/countries/types.ts";
import { seedFor } from "../../../core/seed.ts";
import { generateGrid } from "../generate/generate.ts";
import type { GridRepo } from "../store/repo.ts";
import type { Game, Puzzle } from "../types.ts";

interface Opening {
  guildId: string;
  userId: string;
  date: string;
  now: number;
  snapshot: Snapshot;
}

/** The previous day rules, which a new grid avoids. */
function avoidList(repo: GridRepo, guildId: string, date: string) {
  const before = repo.puzzles.previous(guildId, date);

  return before ? [...before.grid.rows, ...before.grid.cols] : [];
}

/**
 * The day puzzle (generated on first open, avoiding the previous day rules) and this player game;
 * null when no grid could be generated, in which case nothing is stored.
 */
export function openDay(repo: GridRepo, v: Opening): { puzzle: Puzzle; game: Game } | null {
  const { guildId, date, snapshot } = v;
  let puzzle = repo.puzzles.get(guildId, date);

  if (!puzzle) {
    const avoid = avoidList(repo, guildId, date);
    const grid = generateGrid({ snapshot, random: seedFor(guildId, date), avoid });

    if (!grid) return null;

    puzzle = repo.puzzles.create({ guildId, date, grid });
  }

  const game = repo.games.start({
    guildId,
    date,
    userId: v.userId,
    cells: Array.from({ length: 9 }, () => ""),
    guesses: 0,
    lastMiss: null,
    filled: null,
    points: null,
    streak: null,
    startedAt: v.now,
    finishedAt: null,
  });

  return { puzzle, game };
}
