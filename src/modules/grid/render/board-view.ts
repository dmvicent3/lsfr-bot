import type { Award, Game, Grid, Practice } from "../types.ts";
import type { BoardView } from "./types.ts";

/** Where the round is: its scope and, for a daily, the puzzle number and time to the next. */
interface Where {
  scope: string;
  number: number | null;
  untilNext?: string | undefined;
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
    award,
    ...(where.untilNext === undefined ? {} : { untilNext: where.untilNext }),
  };
}
