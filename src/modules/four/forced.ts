import { other, winningColumns } from "./board.ts";
import type { Board, Disc } from "./types.ts";

/** The columns code plays without asking: a win now, else a block of the other side's win. */
export function forcedColumns(b: Board, me: Disc): number[] {
  const wins = winningColumns(b, me);

  return wins.length > 0 ? wins : winningColumns(b, other(me));
}
