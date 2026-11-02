import type { MessageComponentInteraction } from "discord.js";

export interface Sent {
  content?: string;
  components?: unknown[];
  allowedMentions?: unknown;
}

export interface Calls {
  update: Sent[];
  reply: Sent[];
  followUp: Sent[];
  send: Sent[];
}

/** A click as the handlers see it, recording what they answer. */
export function fakeClick(
  userId: string,
  opts: { failSend?: boolean } = {},
): { i: MessageComponentInteraction; calls: Calls } {
  const calls: Calls = { update: [], reply: [], followUp: [], send: [] };
  const channel = {
    send: async (m: Sent) => {
      if (opts.failSend) throw new Error("no permission");

      calls.send.push(m);
    },
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = {
    guildId: "g",
    user: { id: userId },
    channel,
    update: async (m: Sent) => void calls.update.push(m),
    reply: async (m: Sent) => void calls.reply.push(m),
    followUp: async (m: Sent) => void calls.followUp.push(m),
  } as unknown as MessageComponentInteraction;

  return { i, calls };
}
