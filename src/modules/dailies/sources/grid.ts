import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../grid/periods.ts";
import { gridTimeZone } from "../../grid/settings.ts";
import { GridRepo } from "../../grid/store/repo.ts";
import { gridEntry } from "../status/grid.ts";
import type { DailyEntry, Who } from "../types.ts";

export function gridToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = gridTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const game = new GridRepo(db).games.get(who.guildId, date, who.userId);
  const label = `Country grid #${puzzleNumber(date, FIRST_PUZZLE)}`;

  return gridEntry(game, { label, command: "grid play", tz });
}
