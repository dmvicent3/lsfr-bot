import { Events, Message, RESTJSONErrorCodes } from "discord.js";
import type { EventHandler } from "../../core/module.ts";
import { isDiscordError } from "./channels.ts";
import { shouldDeleteMessage } from "./decisions.ts";
import { MotorsportRepo } from "./repo.ts";
import { pickRoast } from "./roasts.ts";

/** Keeps series channels read-only for admins too (they bypass channel permissions). */
const keepSeriesChannelsClean: EventHandler = {
  event: Events.MessageCreate,
  async handle(ctx, ...args) {
    const [message] = args;
    const botId = ctx.client.user?.id;
    if (!(message instanceof Message) || !botId) return;
    const seriesChannelIds = new Set(
      new MotorsportRepo(ctx.db).listFollowed().map((f) => f.channelId),
    );
    const candidate = {
      channelId: message.channelId,
      authorId: message.author.id,
      botId,
      system: message.system,
    };
    if (!shouldDeleteMessage(candidate, seriesChannelIds)) return;
    await deleteQuietly(message);
    // Pin notices just vanish; people get roasted.
    if (message.system || !message.channel.isSendable()) return;
    const roast = await message.channel.send({
      content: pickRoast(`<@${message.author.id}>`),
      allowedMentions: { users: [message.author.id] },
    });
    await Bun.sleep(ROAST_LIFETIME_MS);
    await deleteQuietly(roast);
  },
};

// Gone almost before anyone can read it — part of the joke.
const ROAST_LIFETIME_MS = 1_000;

async function deleteQuietly(message: Message): Promise<void> {
  try {
    await message.delete();
  } catch (err) {
    if (!isDiscordError(err, RESTJSONErrorCodes.UnknownMessage)) throw err;
  }
}

export const motorsportEvents: EventHandler[] = [keepSeriesChannelsClean];
