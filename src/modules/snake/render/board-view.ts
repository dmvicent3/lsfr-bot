import { isGame, type Rec } from "../play/types.ts";
import { award } from "../scoring.ts";
import type { Award } from "../types.ts";
import type { BoardView, Where } from "./types.ts";

/** A finished daily's award, rebuilt from the stored game when the finishing move is past. */
function recap(rec: Rec): Award | null {
  if (!isGame(rec) || rec.finishedAt === null) return null;

  return award(rec.solved === true, rec.guesses.length, rec.streak ?? 0);
}

/** What the board shows for a round; `won` is the award of the finishing move. */
export function boardView(where: Where, rec: Rec, won: Award | null = null): BoardView {
  const finished = rec.finishedAt !== null;

  return {
    scope: where.scope,
    stamp: rec.startedAt.toString(36),
    number: where.number,
    answer: where.answer,
    guesses: rec.guesses,
    finished,
    solved: finished && rec.guesses.at(-1) === where.answer,
    award: won ?? recap(rec),
    ...(where.untilNext === undefined ? {} : { untilNext: where.untilNext }),
  };
}
