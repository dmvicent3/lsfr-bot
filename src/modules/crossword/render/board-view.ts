import { isFull } from "../play/cells.ts";
import { isGame, type Rec } from "../play/types.ts";
import { award, basePoints } from "../scoring.ts";
import type { Award, StoredPuzzle } from "../types.ts";
import type { BoardView } from "./types.ts";

/** Where the round is: its scope, puzzle and, for a daily, the number and time to the next. */
interface Where {
  scope: string;
  number: number | null;
  stored: StoredPuzzle;
  untilNext?: string | undefined;
}

/** A finished daily's award, rebuilt from the stored game when the finishing move is past. */
function recap(rec: Rec): Award | null {
  if (!isGame(rec) || rec.finishedAt === null) return null;

  return award(isFull(rec.cells), rec.wrong, rec.reveals, rec.streak ?? 0);
}

/** What the board shows for a round record at time `now`; `won` is the award of the finishing move. */
export function boardView(
  where: Where,
  rec: Rec,
  now: number,
  won: Award | null = null,
): BoardView {
  return {
    scope: where.scope,
    stamp: rec.startedAt.toString(36),
    number: where.number,
    stored: where.stored,
    cells: rec.cells,
    wrong: rec.wrong,
    reveals: rec.reveals,
    lastLine: rec.lastLine,
    points: (isGame(rec) ? rec.points : null) ?? basePoints(rec.wrong, rec.reveals),
    finished: rec.finishedAt !== null,
    elapsedMs: (rec.finishedAt ?? now) - rec.startedAt,
    award: won ?? recap(rec),
    ...(where.untilNext === undefined ? {} : { untilNext: where.untilNext }),
  };
}
