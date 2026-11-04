import { MessageFlags } from "discord.js";
import { dateIn } from "../../../core/zoned.ts";
import { openDaily } from "../play/open.ts";
import { view } from "../render/view.ts";
import { sudokuTimeZone } from "../settings.ts";
import { DAILY_LEVEL } from "../types.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's board (one medium puzzle a day), solved or not. */
export async function daily({ i, guildId, db, repo, random }: CommandCtx): Promise<void> {
  /** The first open of a day generates the puzzle, which can outlast Discord's 3 s: answer first. */
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const now = Date.now();
  const game = openDaily(repo, {
    guildId,
    userId: i.user.id,
    date: dateIn(now, sudokuTimeZone(db, guildId)),
    level: DAILY_LEVEL,
    now,
    random,
  });

  await i.editReply(view(game, now));
}
