import { Events, Message } from "discord.js";
import { log } from "../../../core/log.ts";
import type { EventHandler } from "../../../core/types.ts";
import { runnerIn } from "../session/registry.ts";

/** Channel messages feed the live session there, if any. */
export const messageEvent: EventHandler = {
  event: Events.MessageCreate,
  async handle(_ctx, ...args) {
    const [message] = args;

    if (!(message instanceof Message) || message.author.bot || !message.inGuild()) return;

    const runner = runnerIn(message.channelId);

    if (!runner) return;

    const name = message.member?.displayName ?? message.author.displayName;
    const answer = {
      userId: message.author.id,
      name,
      text: message.content,
      at: message.createdTimestamp,
    };
    await runner
      .onMessage(answer)
      .catch((err: unknown) => log.error("trivia", "answer failed", err));
  },
};
