import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../sudoku/periods.ts";
import { sudokuTimeZone } from "../../sudoku/settings.ts";
import { SudokuRepo } from "../../sudoku/store/repo.ts";
import { LEVELS } from "../../sudoku/types.ts";
import { sudokuEntry } from "../status/sudoku.ts";
import type { DailyEntry, Who } from "../types.ts";

/** One line per difficulty, easy first. */
export function sudokuToday(db: Database, who: Who, now: number): DailyEntry[] {
  const tz = sudokuTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const number = puzzleNumber(date, FIRST_PUZZLE);
  const games = new SudokuRepo(db).games;

  return LEVELS.map((level) =>
    sudokuEntry(games.get({ ...who, kind: "daily", date, slot: level }), {
      label: `Sudoku ${level} #${number}`,
      command: "sudoku daily",
      tz,
    }),
  );
}
