import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { MODES } from "../../word/multi/modes.ts";
import type { Mode } from "../../word/multi/types.ts";
import { FIRST_MULTI_PUZZLE } from "../../word/puzzle-date.ts";
import { wordSettings } from "../../word/settings.ts";
import { WordRepo } from "../../word/store/repo.ts";
import { wordMultiEntry } from "../status/word-multi.ts";
import type { DailyEntry, Who } from "../types.ts";

/** Word Duo or Word Quad, on the word game's day. */
export function wordMultiToday(db: Database, who: Who, now: number, mode: Mode): DailyEntry {
  const tz = wordSettings(db, who.guildId).timeZone;
  const date = dateIn(now, tz);
  const game = new WordRepo(db).multiGames.get({ ...who, mode, date });
  const label = `${MODES[mode].name} #${puzzleNumber(date, FIRST_MULTI_PUZZLE)}`;

  return wordMultiEntry(game, { label, command: `word ${mode}`, tz });
}
