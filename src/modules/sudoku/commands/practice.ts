import { MessageFlags } from "discord.js";
import { openPractice } from "../play/open.ts";
import { view } from "../render/view.ts";
import { toLevel } from "./level.ts";
import type { CommandCtx } from "./types.ts";

/** Private: a fresh practice board, replacing the previous one. */
export async function practice({ i, guildId, repo, random }: CommandCtx): Promise<void> {
  const now = Date.now();
  const game = openPractice(repo, {
    guildId,
    userId: i.user.id,
    level: toLevel(i.options.getString("difficulty", true)),
    now,
    random,
  });

  await i.reply({ ...view(game, now), flags: MessageFlags.Ephemeral });
}
