import { toBoard } from "../../../src/modules/four/board.ts";
import type { Board } from "../../../src/modules/four/types.ts";

/** A board from rows of 7 "." / "R" / "Y", top row first; missing top rows are empty. */
export const board = (rows: string[]): Board =>
  toBoard([...Array.from({ length: 6 - rows.length }, () => "......."), ...rows].join(""));
