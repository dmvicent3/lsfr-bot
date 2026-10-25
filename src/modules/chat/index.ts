import type { Picked, Mention } from "./types.ts";
import { Events, Message } from "discord.js";
import { generate } from "../../core/llm.ts";
import type { InlineImage } from "../../core/types.ts";
import { log } from "../../core/log.ts";
import type { BotModule, Ctx } from "../../core/types.ts";
import { downloadImages, imageNotes, selectImages } from "./images.ts";
import type { ImageRef } from "./types.ts";
import { PERSONALITY } from "./personality.ts";
import { buildConversation, collectChain, splitMessage, stripMentions } from "./text.ts";

const parentOf = async (m: Message): Promise<Message | null> =>
  m.reference?.messageId ? m.fetchReference() : null;

/** A message's attachments; only people's: Gork's own messages carry none worth re-reading. */
function refsOf(m: Message, botId: string): ImageRef[] {
  if (m.author.id === botId) return [];
  return [...m.attachments.values()].map((a) => ({
    url: a.url,
    size: a.size,
    contentType: a.contentType,
  }));
}

/** The chain as a Gemini conversation, with the downloaded images in their messages. */
function promptOf(chain: Message[], botId: string, byUrl: Map<string, InlineImage | null>) {
  return buildConversation(
    chain.map((m) => ({
      fromBot: m.author.id === botId,
      author: m.member?.displayName ?? m.author.displayName,
      text: m.content,
      images: refsOf(m, botId).flatMap((ref) => byUrl.get(ref.url) ?? []),
    })),
  );
}

/** Downloads the chosen images, asks Gemini, and replies in Discord-sized chunks. */
async function answer(ctx: Ctx, { message, chain, botId }: Mention, { chosen, skipped }: Picked) {
  if ("sendTyping" in message.channel) await message.channel.sendTyping();
  const downloaded = await downloadImages(chosen, fetch);
  const byUrl = new Map(chosen.map((ref, i) => [ref.url, downloaded[i] ?? null]));
  const prompt = promptOf(chain, botId, byUrl);
  if (prompt.length === 0) return;
  const text = await generate(prompt, {
    apiKey: ctx.config.geminiApiKey,
    model: ctx.config.geminiModel,
    system: PERSONALITY,
  });
  const failed = downloaded.filter((image) => image === null).length;
  for (const chunk of splitMessage(text + imageNotes(skipped, failed))) await message.reply(chunk);
}

async function onMessage(ctx: Ctx, message: Message): Promise<void> {
  const me = ctx.client.user;
  if (message.author.bot || !me || !message.mentions.users.has(me.id)) return;
  const chain = await collectChain(message, parentOf);
  const picked = selectImages(chain.map((m) => refsOf(m, me.id)));
  if (picked.chosen.length === 0 && !chain.some((m) => stripMentions(m.content))) return;
  try {
    await answer(ctx, { message, chain, botId: me.id }, picked);
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
