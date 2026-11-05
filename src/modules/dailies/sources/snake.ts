import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../snake/periods.ts";
import { snakeTimeZone } from "../../snake/settings.ts";
import { SnakeRepo } from "../../snake/store/repo.ts";
import { snakeEntry } from "../status/snake.ts";
import type { DailyEntry, Who } from "../types.ts";

export function snakeToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = snakeTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const game = new SnakeRepo(db).games.get(who.guildId, date, who.userId);
  const label = `Snake #${puzzleNumber(date, FIRST_PUZZLE)}`;

  return snakeEntry(game, { label, command: "snake play", tz });
}
