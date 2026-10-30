import type { Client } from "discord.js";
import { log } from "../../../core/log.ts";
import { outgoing, sendTo } from "../../../core/send.ts";
import type { Poster } from "./types.ts";

/** Sends and edits in one channel; nothing it posts pings anyone. */
export function discordPoster(client: Client, channelId: string): Poster {
  return {
    post: (msg) => sendTo(client, channelId, outgoing(msg), "trivia"),
    async edit(messageId, msg) {
      try {
        const channel = await client.channels.fetch(channelId);

        if (!channel?.isTextBased()) return false;

        await channel.messages.edit(messageId, outgoing(msg));

        return true;
      } catch (err) {
        log.error("trivia", `could not edit ${messageId}`, err);

        return false;
      }
    },
  };
}
