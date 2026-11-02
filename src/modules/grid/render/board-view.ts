import type { Snapshot } from "../../../core/countries/types.ts";
import { isGame } from "../play/round.ts";
import { recap } from "../play/finish.ts";
import type { Award, Game, Grid, Practice } from "../types.ts";
import type { BoardView } from "./types.ts";

/** Where the round is: its scope and, for a daily, the puzzle number and time to the next. */
interface Where {
  scope: string;
  number: number | null;
  untilNext?: string | undefined;
  /** Set for a daily so a finished one can rebuild its award. */
  snap?: Snapshot;
}

/** What the board shows for a round record. */
export function boardView(
  where: Where,
  grid: Grid,
  rec: Game | Practice,
  award: Award | null = null,
): BoardView {
  return {
    scope: where.scope,
    number: where.number,
    grid,
    cells: rec.cells,
    guesses: rec.guesses,
    lastMiss: rec.lastMiss,
    points: rec.points ?? 0,
    finished: rec.finishedAt !== null,
    award: award ?? (where.snap && finishedGame(rec) ? recap(rec, where.snap) : null),
    ...(where.untilNext === undefined ? {} : { untilNext: where.untilNext }),
  };
}

const finishedGame = (rec: Game | Practice): rec is Game => isGame(rec) && rec.finishedAt !== null;
