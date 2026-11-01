import { reply } from "../../../core/replies.ts";
import { startSession } from "../session/start.ts";
import { memberName } from "./name.ts";
import type { CommandCtx } from "./types.ts";

/** Public, so the channel sees who started it; the first question follows on the next tick. */
export async function start({ i, guildId, ctx, random }: CommandCtx): Promise<void> {
  const buttonsOnly = i.options.getBoolean("buttons") ?? false;
  const where = {
    guildId,
    channelId: i.channelId,
    userId: i.user.id,
    now: Date.now(),
    buttonsOnly,
  };

  if (startSession(ctx, where, random) === "busy")
    return reply(i, "Trivia is already running here.");

  const name = memberName(i);
  const mode = buttonsOnly ? " (buttons only)" : "";
  await i.reply({
    content: `🧠 Trivia started by **${name}**${mode}`,
    allowedMentions: { parse: [] },
  });
}
