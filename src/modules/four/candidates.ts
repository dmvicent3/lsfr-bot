import { legalColumns } from "./board.ts";
import { forcedColumns } from "./forced.ts";
import { SEARCH_DEPTH, lostColumns } from "./search.ts";
import type { Board, Difficulty, Disc } from "./types.ts";

export interface Candidates {
  cols: number[];
  /** Code chose (a win or a block); jev is not asked. */
  forced: boolean;
}

/** The columns jevos may choose from at `level`. */
export function candidates(b: Board, me: Disc, level: Difficulty): Candidates {
  const legal = legalColumns(b);

  if (level === "easy") return { cols: legal, forced: false };

  const forced = forcedColumns(b, me);

  if (forced.length > 0) return { cols: forced, forced: true };

  if (level === "normal") return { cols: legal, forced: false };

  const lost = lostColumns(b, me, SEARCH_DEPTH);
  const safe = legal.filter((c) => !lost.includes(c));

  return { cols: safe.length > 0 ? safe : legal, forced: false };
}
