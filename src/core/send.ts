import type {
  Client,
  MessageComponentInteraction,
  MessageCreateOptions,
  MessageMentionOptions,
} from "discord.js";
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

/** Sends to a channel; a channel the bot can no longer use is "lost-channel". Failures log under `scope`. */
export async function sendTo(
  client: Client,
  channelId: string,
  message: MessageCreateOptions,
  scope: string,
): Promise<SendResult> {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel?.isSendable()) return { result: "lost-channel" };

    const sent = await channel.send(message.allowedMentions ? message : outgoing(message));

    return { result: "ok", messageId: sent.id };
  } catch (err) {
    const result = sendFailure(err);

    if (result === "failed") log.error(scope, `send to ${channelId} failed`, err);

    return { result };
  }
}

/** Posts `content` in the clicked message's channel, pinging no one; a failure or no channel is logged, never thrown. */
export async function postOrLog(
  i: MessageComponentInteraction,
  scope: string,
  what: string,
  content: string,
): Promise<void> {
  try {
    if (!i.channel || !("send" in i.channel)) {
      log.error(scope, `${what}: no channel to send to`);

      return;
    }

    await i.channel.send(outgoing({ content }));
  } catch (err) {
    log.error(scope, what, err);
  }
}
