import type { Database } from "bun:sqlite";
import { dailyLookup, dayOf } from "../../../core/daily-guard.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import type { Turn } from "../play/turn.ts";
import type { Rec } from "../play/types.ts";
import type { Where } from "../render/board-view.ts";
import { crosswordTimeZone } from "../settings.ts";
import { CrosswordRepo } from "../store/repo.ts";

export const STALE = "This puzzle has changed. Use /crossword play.";
export const PRACTICE = "practice";

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

  const found = dailyLookup(repo, guildId, scope, userId);

  return found ? { rec: found.game, where: { scope, number: null, stored: found.puzzle } } : null;
}

/** A daily's board knows its number and the time to the next puzzle; practice has neither. */
function timed(where: Where, now: number, tz: string): Where {
  if (where.scope === PRACTICE) return where;

  return { ...where, ...dayOf(where.scope, FIRST_PUZZLE, now, tz) };
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

  return {
    repo,
    rec,
    now,
    where: timed(where, now, crosswordTimeZone(db, i.guildId)),
    stale: rec.startedAt.toString(36) !== stamp,
  };
}
