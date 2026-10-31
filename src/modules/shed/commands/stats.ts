import { renderStats } from "../render/boards.ts";
import type { CommandCtx } from "./types.ts";

/** Public; mentions never ping. */
export async function stats({ i, guildId, repo }: CommandCtx): Promise<void> {
  const userId = (i.options.getUser("member") ?? i.user).id;
  await i.reply({
    content: renderStats(userId, repo.places.stats(guildId, userId)),
    allowedMentions: { parse: [] },
  });
}
