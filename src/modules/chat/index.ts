import type { Picked, Mention } from "./types.ts";
import { Events, Message } from "discord.js";
import { generate } from "../../core/llm.ts";
import type { InlineImage } from "../../core/types.ts";
import { keepTyping } from "./typing.ts";
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

/** The chain as a conversation, with the downloaded images in their messages. */
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

/** What chat needs: the local model, and SearXNG when web search is on. */
export interface ChatOptions {
  llmUrl: string;
  searchUrl: string | null;
}

/** Downloads the chosen images, asks the model, and replies in Discord-sized chunks. */
async function answer(o: ChatOptions, { message, chain, botId }: Mention, picked: Picked) {
  const { channel } = message;
  const stop = keepTyping(async () => ("sendTyping" in channel ? channel.sendTyping() : null));

  try {
    await reply(o, { message, chain, botId }, picked);
  } finally {
    stop();
  }
}

async function reply(
  o: ChatOptions,
  { message, chain, botId }: Mention,
  { chosen, skipped }: Picked,
) {
  const downloaded = await downloadImages(chosen, fetch);
  const byUrl = new Map(chosen.map((ref, i) => [ref.url, downloaded[i] ?? null]));
  const prompt = promptOf(chain, botId, byUrl);

  if (prompt.length === 0) return;

  const text = await generate(prompt, { url: o.llmUrl, system: PERSONALITY });
  const failed = downloaded.filter((image) => image === null).length;

  for (const chunk of splitMessage(text + imageNotes(skipped, failed))) await message.reply(chunk);
}

async function onMessage(ctx: Ctx, o: ChatOptions, message: Message): Promise<void> {
  const me = ctx.client.user;

  if (message.author.bot || !me || !message.mentions.users.has(me.id)) return;

  const chain = await collectChain(message, parentOf);
  const picked = selectImages(chain.map((m) => refsOf(m, me.id)));

  if (picked.chosen.length === 0 && !chain.some((m) => stripMentions(m.content))) return;

  try {
    await answer(o, { message, chain, botId: me.id }, picked);
  } catch (err) {
    log.error("chat", "LLM reply failed", err);
    await message.reply("⚠️ Couldn't get an answer right now.");
  }
}

/** On only with LLM_URL: @Gork answers from the local model. */
export const chatModule = (o: ChatOptions): BotModule => ({
  name: "chat",
  title: "💬 Chat",
  helpNote:
    "Mention @Gork with a question for an answer from the local model (it can search the web); attach images (up to 4) and it looks at them too. Reply to its answer (anyone can) to keep the conversation going; it remembers the reply chain.",
  events: [
    {
      event: Events.MessageCreate,
      async handle(ctx, ...args) {
        const [message] = args;

        if (message instanceof Message) await onMessage(ctx, o, message);
      },
    },
  ],
});
