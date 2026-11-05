import { MessageFlags } from "discord.js";
import { dayOf } from "../../../core/daily-guard.ts";
import { log } from "../../../core/log.ts";
import { reply } from "../../../core/replies.ts";
import { dateIn } from "../../../core/zoned.ts";
import { FIRST_PUZZLE } from "../periods.ts";
import { dailyMake } from "../play/make.ts";
import { openDaily } from "../play/open.ts";
import { boardView } from "../render/board-view.ts";
import { groupsView } from "../render/view.ts";
import { groupsTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's board, or the result once finished. */
export async function play({ i, guildId, db, repo }: CommandCtx): Promise<void> {
  const now = Date.now();
  const tz = groupsTimeZone(db, guildId);
  const date = dateIn(now, tz);
  const v = { guildId, userId: i.user.id, date, now };
  const opened = openDaily(repo, v, dailyMake(repo, v));

  if (!opened) {
    log.error("groups", `no puzzle generated for ${guildId} ${date}`);

    return reply(i, "No groups puzzle today — couldn't build one.");
  }

  const where = { scope: date, puzzle: opened.puzzle, ...dayOf(date, FIRST_PUZZLE, now, tz) };
  const view = groupsView(boardView(where, opened.game));

  await i.reply({ ...view, flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
}
