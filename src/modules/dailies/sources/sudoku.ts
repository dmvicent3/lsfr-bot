import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../sudoku/periods.ts";
import { sudokuTimeZone } from "../../sudoku/settings.ts";
import { SudokuRepo } from "../../sudoku/store/repo.ts";
import { sudokuEntry } from "../status/sudoku.ts";
import type { DailyEntry, Who } from "../types.ts";

/** The day's one sudoku, named by its level once picked. */
export function sudokuToday(db: Database, who: Who, now: number): DailyEntry[] {
  const tz = sudokuTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const number = puzzleNumber(date, FIRST_PUZZLE);
  const games = new SudokuRepo(db).games;

  const game = games.dailyOn(who.guildId, who.userId, date);
  const label = game ? `Sudoku ${game.level} #${number}` : `Sudoku #${number}`;

  return [sudokuEntry(game, { label, command: "sudoku daily", tz })];
}
