import { Events, Message, RESTJSONErrorCodes } from "discord.js";
import type { EventHandler } from "../../core/module.ts";
import { isDiscordError } from "./channels.ts";
import { shouldDeleteMessage } from "./decisions.ts";
import { MotorsportRepo } from "./repo.ts";

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
    try {
      await message.delete();
    } catch (err) {
      if (!isDiscordError(err, RESTJSONErrorCodes.UnknownMessage)) throw err;
    }
  },
};

export const motorsportEvents: EventHandler[] = [keepSeriesChannelsClean];
