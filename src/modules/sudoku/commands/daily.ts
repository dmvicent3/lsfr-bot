import { MessageFlags } from "discord.js";
import { dateIn } from "../../../core/zoned.ts";
import { openDaily } from "../play/open.ts";
import { pickDaily } from "../play/pick.ts";
import { view } from "../render/view.ts";
import { sudokuTimeZone } from "../settings.ts";
import { toLevel } from "./level.ts";
import type { CommandCtx } from "./types.ts";

/** Private: today's board at the level picked on the day's first open, solved or not. */
export async function daily({ i, guildId, db, repo, random }: CommandCtx): Promise<void> {
  /** The first open of a day generates the puzzle, which can outlast Discord's 3 s: answer first. */
  await i.deferReply({ flags: MessageFlags.Ephemeral });

  const now = Date.now();
  const date = dateIn(now, sudokuTimeZone(db, guildId));
  const asked = i.options.getString("difficulty");
  const today = repo.games.dailyOn(guildId, i.user.id, date);
  const pick = pickDaily(today, asked === null ? null : toLevel(asked));
  const game = openDaily(repo, {
    guildId,
    userId: i.user.id,
    date,
    level: pick.level,
    now,
    random,
  });

  await i.editReply(view(game, now));

  if (pick.note) await i.followUp({ content: pick.note, flags: MessageFlags.Ephemeral });
}
