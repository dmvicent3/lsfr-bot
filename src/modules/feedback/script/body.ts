import type { RESTPostAPIChannelMessageJSONBody } from "discord.js";
import { isRecord } from "../../../core/guards.ts";
import type { PollRequest } from "./types.ts";

const HOUR_MS = 3_600_000;

/** The message that carries the poll; pings no one. */
export function pollBody(p: PollRequest): RESTPostAPIChannelMessageJSONBody {
  return {
    poll: {
      question: { text: p.question },
      answers: p.options.map((text) => ({ poll_media: { text } })),
      duration: p.hours,
      allow_multiselect: p.multi,
    },
    allowed_mentions: { parse: [] },
  };
}

/** When the posted poll ends: Discord's expiry, or the requested hours from now. */
export function pollEnd(sent: unknown, now: number, hours: number): number {
  const poll = isRecord(sent) && isRecord(sent.poll) ? sent.poll : {};
  const expiry = typeof poll.expiry === "string" ? Date.parse(poll.expiry) : Number.NaN;

  return Number.isNaN(expiry) ? now + hours * HOUR_MS : expiry;
}

export const messageUrl = (guildId: string, channelId: string, messageId: string): string =>
  `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
