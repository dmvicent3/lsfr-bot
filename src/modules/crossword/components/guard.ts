import type { Database } from "bun:sqlite";
import { puzzleNumber, untilNext } from "../../../core/daily.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import type { Turn } from "../play/turn.ts";
import type { Rec } from "../play/types.ts";
import type { Where } from "../render/board-view.ts";
import { crosswordTimeZone } from "../settings.ts";
import { CrosswordRepo } from "../store/repo.ts";

export const STALE = "This puzzle has changed. Use /crossword play.";
export const PRACTICE = "practice";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** One player's round as a handler sees it. */
export interface Round {
  repo: CrosswordRepo;
  rec: Rec;
  where: Where;
  now: number;
  /** The component or modal belongs to an earlier round than the stored one. */
  stale: boolean;
}

export const turnOf = (r: Round): Turn => ({
  repo: r.repo,
  rec: r.rec,
  puzzle: r.where.stored.puzzle,
  now: r.now,
});

function find(
  repo: CrosswordRepo,
  guildId: string,
  userId: string,
  scope: string,
): { rec: Rec; where: Where } | null {
  if (scope === PRACTICE) {
    const rec = repo.practice.get(guildId, userId);

    return rec ? { rec, where: { scope, number: null, stored: rec } } : null;
  }

  const stored = DATE.test(scope) ? repo.puzzles.get(guildId, scope) : null;
  const rec = repo.games.get(guildId, scope, userId);

  if (!stored || !rec) return null;

  return { rec, where: { scope, number: puzzleNumber(scope, FIRST_PUZZLE), stored } };
}

/**
 * The clicker's own round for `[scope, stamp]` of a custom ID; null when there is none (no game,
 * or a date with no puzzle). Reads only: the caller judges and stores in the same tick, with no
 * await between, so two clicks can't both pass the same check.
 */
export function load(
  i: { guildId: string | null; user: { id: string } },
  db: Database,
  args: string[],
): Round | null {
  const [scope, stamp] = args;

  if (!i.guildId || !scope) return null;

  const now = Date.now();
  const repo = new CrosswordRepo(db);
  const found = find(repo, i.guildId, i.user.id, scope);

  if (!found) return null;

  const { rec, where } = found;
  const tz = crosswordTimeZone(db, i.guildId);
  const timed = where.number === null ? where : { ...where, untilNext: untilNext(now, tz) };

  return { repo, rec, now, where: timed, stale: rec.startedAt.toString(36) !== stamp };
}
