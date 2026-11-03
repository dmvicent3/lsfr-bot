import type { Database } from "bun:sqlite";
import { dateIn } from "../../../core/zoned.ts";
import { puzzleNumber } from "../../word/puzzle-date.ts";
import { wordSettings } from "../../word/settings.ts";
import { WordRepo } from "../../word/store/repo.ts";
import { wordEntry } from "../status/word.ts";
import type { DailyEntry, Who } from "../types.ts";

export function wordToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = wordSettings(db, who.guildId).timeZone;
  const date = dateIn(now, tz);
  const game = new WordRepo(db).games.get(who.guildId, date, who.userId);

  return wordEntry(game, { label: `Word #${puzzleNumber(date)}`, command: "word play", tz });
}
