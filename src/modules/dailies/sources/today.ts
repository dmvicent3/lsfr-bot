import type { Database } from "bun:sqlite";
import type { DailyEntry, Who } from "../types.ts";
import { crosswordToday } from "./crossword.ts";
import { duelToday } from "./duel.ts";
import { gridToday } from "./grid.ts";
import { sudokuToday } from "./sudoku.ts";
import { wordToday } from "./word.ts";

/** Every daily for the player, each on its own game's today; read-only. */
export const todayEntries = (db: Database, who: Who, now: number): DailyEntry[] => [
  wordToday(db, who, now),
  ...sudokuToday(db, who, now),
  duelToday(db, who, now),
  gridToday(db, who, now),
  crosswordToday(db, who, now),
];
