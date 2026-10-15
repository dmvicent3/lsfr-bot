import { Events, Message } from "discord.js";
import { generate } from "../../core/llm.ts";
import { log } from "../../core/log.ts";
import type { BotModule, Ctx } from "../../core/module.ts";
import { downloadImages, type ImageRef, imageNotes, selectImages } from "./images.ts";
import { PERSONALITY } from "./personality.ts";
import { buildConversation, collectChain, splitMessage, stripMentions } from "./text.ts";

const parentOf = async (m: Message): Promise<Message | null> =>
  m.reference?.messageId ? m.fetchReference() : null;

async function onMessage(ctx: Ctx, message: Message): Promise<void> {
  const me = ctx.client.user;
  if (message.author.bot || !me || !message.mentions.users.has(me.id)) return;
  const chain = await collectChain(message, parentOf);
  // Only people's images: Gork's own messages carry none worth re-reading.
  const refsOf = (m: Message): ImageRef[] =>
    m.author.id === me.id
      ? []
      : [...m.attachments.values()].map((a) => ({
          url: a.url,
          size: a.size,
          contentType: a.contentType,
        }));
  const { chosen, skipped } = selectImages(chain.map(refsOf));
  if (chosen.length === 0 && !chain.some((m) => stripMentions(m.content))) return;
  try {
    if ("sendTyping" in message.channel) await message.channel.sendTyping();
    const downloaded = await downloadImages(chosen, fetch);
    const byUrl = new Map(chosen.map((ref, i) => [ref.url, downloaded[i] ?? null]));
    const prompt = buildConversation(
      chain.map((m) => ({
        fromBot: m.author.id === me.id,
        author: m.member?.displayName ?? m.author.displayName,
        text: m.content,
        images: refsOf(m).flatMap((ref) => byUrl.get(ref.url) ?? []),
      })),
    );
    if (prompt.length === 0) return;
    const answer = await generate(prompt, {
      apiKey: ctx.config.geminiApiKey,
      model: ctx.config.geminiModel,
      system: PERSONALITY,
    });
    const failed = downloaded.filter((image) => image === null).length;
    for (const chunk of splitMessage(answer + imageNotes(skipped, failed))) {
      await message.reply(chunk);
    }
  } catch (err) {
    log.error("chat", "LLM reply failed", err);
    await message.reply("⚠️ Couldn't get an answer right now.");
  }
}

export const chatModule: BotModule = {
  name: "chat",
  title: "💬 Chat",
  helpNote:
    "Mention @Gork with a question for an AI answer; attach images (up to 4) and it looks at them too. Reply to its answer (anyone can) to keep the conversation going; it remembers the reply chain.",
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
