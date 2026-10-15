import { Events, Message } from "discord.js";
import { generate } from "../../core/llm.ts";
import { log } from "../../core/log.ts";
import type { BotModule, Ctx } from "../../core/module.ts";
import { buildConversation, collectChain, splitMessage } from "./text.ts";

const parentOf = async (m: Message): Promise<Message | null> =>
  m.reference?.messageId ? m.fetchReference() : null;

async function onMessage(ctx: Ctx, message: Message): Promise<void> {
  const me = ctx.client.user;
  if (message.author.bot || !me || !message.mentions.users.has(me.id)) return;
  const chain = await collectChain(message, parentOf);
  const prompt = buildConversation(
    chain.map((m) => ({
      fromBot: m.author.id === me.id,
      author: m.member?.displayName ?? m.author.displayName,
      text: m.content,
    })),
  );
  if (prompt.length === 0) return;
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
    "Mention @Gork with a question for an AI answer. Reply to its answer (anyone can) to keep the conversation going; it remembers the reply chain.",
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
