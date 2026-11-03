import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../duel/periods.ts";
import { duelTimeZone } from "../../duel/settings.ts";
import { DuelRepo } from "../../duel/store/repo.ts";
import { duelEntry } from "../status/duel.ts";
import type { DailyEntry, Who } from "../types.ts";

export function duelToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = duelTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const game = new DuelRepo(db).games.get(who.guildId, date, who.userId);
  const label = `Stat duel #${puzzleNumber(date, FIRST_PUZZLE)}`;

  return duelEntry(game, { label, command: "duel play", tz });
}
