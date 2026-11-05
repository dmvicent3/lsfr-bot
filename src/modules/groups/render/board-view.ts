import { isGame, type Rec } from "../play/types.ts";
import { award } from "../scoring.ts";
import type { Award } from "../types.ts";
import type { BoardView, Where } from "./types.ts";

/** A finished daily's award, rebuilt from the stored game when the finishing move is past. */
function recap(rec: Rec): Award | null {
  if (!isGame(rec) || rec.finishedAt === null) return null;

  return award(rec.solved === true, rec.mistakes, rec.streak ?? 0);
}

/** A finished round was solved when all four groups were found. */
const solvedOf = (rec: Rec): boolean => rec.finishedAt !== null && rec.found.length === 4;

/** What the board shows for a round; `won` is the award of the finishing move. */
export function boardView(where: Where, rec: Rec, won: Award | null = null): BoardView {
  return {
    scope: where.scope,
    stamp: rec.startedAt.toString(36),
    number: where.number,
    puzzle: where.puzzle,
    progress: rec,
    finished: rec.finishedAt !== null,
    solved: solvedOf(rec),
    award: won ?? recap(rec),
    ...(where.untilNext === undefined ? {} : { untilNext: where.untilNext }),
  };
}
