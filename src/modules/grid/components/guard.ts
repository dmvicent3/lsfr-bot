import type { Database } from "bun:sqlite";
import type { Snapshot } from "../../../core/countries/types.ts";
import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { isOver } from "../play/answer.ts";
import { healed } from "../play/heal.ts";
import { gridTimeZone } from "../settings.ts";
import { GridRepo } from "../store/repo.ts";
import type { Award, Game, Grid, Practice } from "../types.ts";
import { end, isGame } from "./land.ts";

export const OUT_OF_DATE = "This grid is out of date. Use /grid play.";
export const PRACTICE = "practice";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Where the snapshot comes from; tests inject one. */
export type Source = () => Snapshot | null;

/** One player's game (a day, or the practice round) as a handler sees it. */
export interface Round {
  repo: GridRepo;
  snap: Snapshot;
  now: number;
  scope: string;
  grid: Grid;
  rec: Game | Practice;
  /** Set when loading finished a round that was over but not finished. */
  award: Award | null;
  /** Puzzle number and time to the next grid; null/undefined for practice. */
  number: number | null;
  untilNext?: string;
}

function healRound(repo: GridRepo, rec: Game | Practice, now: number) {
  if (isGame(rec)) return healed(repo, rec, now);

  if (isOver(rec.cells, rec.guesses) && rec.finishedAt === null) return end(repo, rec, now);

  return { game: rec, award: null };
}

/**
 * The clicker's own round for the scope in a custom ID (a date or "practice"); null when it, the
 * puzzle or the country data is missing. An over round is finished here, so it never renders as
 * finished unsaved; so this may write, and the round carries the award it produced.
 */
export function load(
  i: { guildId: string | null; user: { id: string } },
  db: Database,
  scope: string | undefined,
  source: Source,
): Round | null {
  const snap = source();

  if (!i.guildId || !scope || !snap) return null;

  const repo = new GridRepo(db);
  const now = Date.now();

  if (scope === PRACTICE) {
    const rec = repo.practice.get(i.guildId, i.user.id);

    if (!rec) return null;

    const { game, award } = healRound(repo, rec, now);

    return { repo, snap, now, scope, grid: rec.grid, rec: game, award, number: null };
  }

  const puzzle = DATE.test(scope) ? repo.puzzles.get(i.guildId, scope) : null;
  const stored = repo.games.get(i.guildId, scope, i.user.id);

  if (!puzzle || !stored) return null;

  const { game, award } = healRound(repo, stored, now);
  const number = puzzleNumber(scope, FIRST_PUZZLE);
  const left = untilNext(now, gridTimeZone(db, i.guildId));

  return { repo, snap, now, scope, grid: puzzle.grid, rec: game, award, number, untilNext: left };
}
