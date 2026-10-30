import { reply } from "../../../core/replies.ts";
import { startSession } from "../session/start.ts";
import { memberName } from "./name.ts";
import type { CommandCtx } from "./types.ts";

/** Public, so the channel sees who started it; the first question follows on the next tick. */
export async function start({ i, guildId, ctx, random }: CommandCtx): Promise<void> {
  const where = { guildId, channelId: i.channelId, userId: i.user.id, now: Date.now() };

  if (startSession(ctx, where, random) === "busy")
    return reply(i, "Trivia is already running here.");

  const name = memberName(i);
  await i.reply({ content: `🧠 Trivia started by **${name}**`, allowedMentions: { parse: [] } });
}
