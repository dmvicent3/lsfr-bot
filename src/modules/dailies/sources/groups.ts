import type { Database } from "bun:sqlite";
import { puzzleNumber } from "../../../core/daily.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../../groups/periods.ts";
import { groupsTimeZone } from "../../groups/settings.ts";
import { GroupsRepo } from "../../groups/store/repo.ts";
import { groupsEntry } from "../status/groups.ts";
import type { DailyEntry, Who } from "../types.ts";

export function groupsToday(db: Database, who: Who, now: number): DailyEntry {
  const tz = groupsTimeZone(db, who.guildId);
  const date = dateIn(now, tz);
  const game = new GroupsRepo(db).games.get(who.guildId, date, who.userId);
  const label = `Groups #${puzzleNumber(date, FIRST_PUZZLE)}`;

  return groupsEntry(game, { label, command: "groups play", tz });
}
