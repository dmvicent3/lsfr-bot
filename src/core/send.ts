import type { Client, MessageCreateOptions, MessageMentionOptions } from "discord.js";
import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import { log } from "./log.ts";
import type { SendResult } from "./types.ts";

const LOST = new Set<unknown>([
  RESTJSONErrorCodes.MissingAccess,
  RESTJSONErrorCodes.UnknownChannel,
  RESTJSONErrorCodes.UnknownGuild,
]);

/** A send error: the channel or server gone is "lost-channel"; anything else is worth retrying. */
export function sendFailure(err: unknown): "lost-channel" | "failed" {
  return err instanceof DiscordAPIError && LOST.has(err.code) ? "lost-channel" : "failed";
}

/** Pings only what `allowed` names; by default nothing, since message text may be untrusted. */
export function outgoing<T>(
  message: T,
  allowed: MessageMentionOptions = { parse: [] },
): T & { allowedMentions: MessageMentionOptions } {
  return { ...message, allowedMentions: allowed };
}

/** Sends to a channel; a channel the bot can no longer use is "lost-channel". */
export async function sendTo(
  client: Client,
  channelId: string,
  message: MessageCreateOptions,
): Promise<SendResult> {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel?.isSendable()) return { result: "lost-channel" };

    const sent = await channel.send(message.allowedMentions ? message : outgoing(message));

    return { result: "ok", messageId: sent.id };
  } catch (err) {
    const result = sendFailure(err);

    if (result === "failed") log.error("send", `send to ${channelId} failed`, err);

    return { result };
  }
}
