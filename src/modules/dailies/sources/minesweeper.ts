import type { Database } from "bun:sqlite";
import { dateIn } from "../../../core/zoned.ts";
import { dailyNumber } from "../../minesweeper/daily/periods.ts";
import { minesweeperTimeZone } from "../../minesweeper/settings.ts";
import { GameStore } from "../../minesweeper/store/games.ts";
import { minesweeperEntry } from "../status/minesweeper.ts";
import type { DailyEntry, Who } from "../types.ts";

/** The day's one minesweeper, named by its level once picked. */
export function minesweeperToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = minesweeperTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const number = dailyNumber(date);
  const game = new GameStore(db).dailies.on(who.guildId, who.userId, date);
  const label = game?.level ? `Minesweeper ${game.level} #${number}` : `Minesweeper #${number}`;

  return minesweeperEntry(game, { label, command: "minesweeper daily", tz });
}
