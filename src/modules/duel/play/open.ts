import { generate } from "../questions/generate.ts";
import { recentKeys } from "../questions/pick.ts";
import type { DuelRepo } from "../store/repo.ts";
import type { Game, Puzzle, Snapshot } from "../types.ts";

const RECENT_DAYS = 90;

interface Opening {
  guildId: string;
  userId: string;
  date: string;
  now: number;
  snapshot: Snapshot;
}

/** The day's puzzle (generated on first open) and this player's game. */
export function openDay(repo: DuelRepo, v: Opening): { puzzle: Puzzle; game: Game } {
  const { guildId, date, snapshot } = v;
  const stored = repo.puzzles.get(guildId, date);
  const recent = recentKeys(repo.puzzles.recent(guildId, date, RECENT_DAYS));
  const puzzle =
    stored ??
    repo.puzzles.create({
      guildId,
      date,
      questions: generate({ snapshot, guildId, date, recent }),
    });
  const game = repo.games.start({
    guildId,
    date,
    userId: v.userId,
    answers: "",
    correct: null,
    points: null,
    streak: null,
    startedAt: v.now,
    finishedAt: null,
  });

  return { puzzle, game };
}
