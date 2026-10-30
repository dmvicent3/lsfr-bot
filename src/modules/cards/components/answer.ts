import { MessageFlags, type MessageComponentInteraction } from "discord.js";
import { runnerIn } from "../session/registry.ts";
import type { Runner } from "../session/runner.ts";
import { NO_GAME } from "./replies.ts";

/** A private reply from the channel's game, or "no game" when there is none. */
export async function privately(
  i: MessageComponentInteraction,
  fn: (runner: Runner) => Promise<string>,
): Promise<void> {
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const runner = runnerIn(i.channelId);
  const content = runner ? await fn(runner) : NO_GAME;
  await i.editReply({ content, allowedMentions: { parse: [] } });
}
