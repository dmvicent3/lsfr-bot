import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../crossword/periods.ts";
import { crosswordTimeZone } from "../../crossword/settings.ts";
import { CrosswordRepo } from "../../crossword/store/repo.ts";
import { crosswordEntry } from "../status/crossword.ts";
import type { DailyEntry, Who } from "../types.ts";

export function crosswordToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = crosswordTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const game = new CrosswordRepo(db).games.get(who.guildId, date, who.userId);
  const label = `Crossword #${puzzleNumber(date, FIRST_PUZZLE)}`;

  return crosswordEntry(game, { label, command: "crossword play", tz });
}
