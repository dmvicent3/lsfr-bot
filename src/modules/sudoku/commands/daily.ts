import { MessageFlags } from "discord.js";
import { dateIn } from "../../../core/zoned.ts";
import { openDaily } from "../play/open.ts";
import { view } from "../render/view.ts";
import { sudokuTimeZone } from "../settings.ts";
import { toLevel } from "./level.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's board for this level, solved or not. */
export async function daily({ i, guildId, db, repo, random }: CommandCtx): Promise<void> {
  const now = Date.now();
  const game = openDaily(repo, {
    guildId,
    userId: i.user.id,
    date: dateIn(now, sudokuTimeZone(db, guildId)),
    level: toLevel(i.options.getString("difficulty", true)),
    now,
    random,
  });

  await i.reply({ ...view(game, now), flags: MessageFlags.Ephemeral });
}
