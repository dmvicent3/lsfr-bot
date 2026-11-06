import type { Database } from "bun:sqlite";
import type { DailyEntry, Who } from "../types.ts";
import { crosswordToday } from "./crossword.ts";
import { duelToday } from "./duel.ts";
import { gridToday } from "./grid.ts";
import { groupsToday } from "./groups.ts";
import { snakeToday } from "./snake.ts";
import { sudokuToday } from "./sudoku.ts";
import { triviaToday } from "./trivia.ts";
import { wordToday } from "./word.ts";
import { wordMultiToday } from "./word-multi.ts";

/** Every daily for the player, each on its own game's today; read-only. */
export const todayEntries = (db: Database, who: Who, now: number): DailyEntry[] => [
  wordToday(db, who, now),
  wordMultiToday(db, who, now, "duo"),
  wordMultiToday(db, who, now, "quad"),
  ...sudokuToday(db, who, now),
  duelToday(db, who, now),
  gridToday(db, who, now),
  crosswordToday(db, who, now),
  groupsToday(db, who, now),
  snakeToday(db, who, now),
  triviaToday(db, who, now),
];
