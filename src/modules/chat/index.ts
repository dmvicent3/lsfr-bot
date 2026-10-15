import { Events, Message } from "discord.js";
import { generate } from "../../core/llm.ts";
import { log } from "../../core/log.ts";
import type { BotModule, Ctx } from "../../core/module.ts";
import { buildPrompt, splitMessage, stripMentions } from "./text.ts";

async function referencedContent(message: Message): Promise<string | null> {
  if (!message.reference?.messageId) return null;
  try {
    return (await message.fetchReference()).content.trim();
  } catch (err) {
    log.error("chat", "could not fetch the replied-to message", err);
    return null;
  }
}

async function onMessage(ctx: Ctx, message: Message): Promise<void> {
  const me = ctx.client.user;
  if (message.author.bot || !me || !message.mentions.users.has(me.id)) return;
  const prompt = buildPrompt(stripMentions(message.content), await referencedContent(message));
  try {
    if ("sendTyping" in message.channel) await message.channel.sendTyping();
    const answer = await generate(prompt, {
      apiKey: ctx.config.geminiApiKey,
      model: ctx.config.geminiModel,
    });
    for (const chunk of splitMessage(answer)) await message.reply(chunk);
  } catch (err) {
    log.error("chat", "LLM reply failed", err);
    await message.reply("⚠️ Couldn't get an answer right now.");
  }
}

export const chatModule: BotModule = {
  name: "chat",
  title: "💬 Chat",
  helpNote:
    "Mention @Gork with a question (or reply to a message while mentioning it) for an AI answer.",
  events: [
    {
      event: Events.MessageCreate,
      async handle(ctx, ...args) {
        const [message] = args;
        if (message instanceof Message) await onMessage(ctx, message);
      },
    },
  ],
};
