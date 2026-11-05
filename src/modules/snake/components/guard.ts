import type { Database } from "bun:sqlite";
import { dailyLookup, dayOf } from "../../../core/daily-guard.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import type { Rec, Turn } from "../play/types.ts";
import type { Where } from "../render/types.ts";
import { snakeTimeZone } from "../settings.ts";
import { SnakeRepo } from "../store/repo.ts";

export const STALE = "This round has changed. Use /snake play.";
export const PRACTICE = "practice";

/** One player's round as a handler sees it. */
export interface Round {
  repo: SnakeRepo;
  rec: Rec;
  where: Where;
  now: number;
  /** The button or modal belongs to an earlier round than the stored one. */
  stale: boolean;
}

export const turnOf = (r: Round): Turn => ({
  repo: r.repo,
  rec: r.rec,
  answer: r.where.answer,
  now: r.now,
});

function find(
  repo: SnakeRepo,
  guildId: string,
  userId: string,
  scope: string,
): { rec: Rec; where: Where } | null {
  if (scope === PRACTICE) {
    const rec = repo.practice.get(guildId, userId);

    return rec ? { rec, where: { scope, number: null, answer: rec.answer } } : null;
  }

  const found = dailyLookup(repo, guildId, scope, userId);

  return found ? { rec: found.game, where: { scope, number: null, answer: found.puzzle } } : null;
}

/** A daily's board knows its number and the time to the next puzzle; practice has neither. */
function timed(where: Where, now: number, tz: string): Where {
  if (where.scope === PRACTICE) return where;

  return { ...where, ...dayOf(where.scope, FIRST_PUZZLE, now, tz) };
}

/**
 * The clicker's own round for `[scope, stamp]` of a custom ID; null when there is none. Reads
 * only: the caller judges and stores in the same tick, with no await between, so two clicks
 * can't both pass the same check. Another user's click finds their own round, never the owner's.
 */
export function load(
  i: { guildId: string | null; user: { id: string } },
  db: Database,
  args: string[],
): Round | null {
  const [scope, stamp] = args;

  if (!i.guildId || !scope) return null;

  const now = Date.now();
  const repo = new SnakeRepo(db);
  const found = find(repo, i.guildId, i.user.id, scope);

  if (!found) return null;

  return {
    repo,
    rec: found.rec,
    now,
    where: timed(found.where, now, snakeTimeZone(db, i.guildId)),
    stale: found.rec.startedAt.toString(36) !== stamp,
  };
}
