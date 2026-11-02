import type { MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";

export interface Sent {
  content?: string;
  components?: unknown[];
  allowedMentions?: unknown;
  custom_id?: string;
}

export interface Calls {
  update: Sent[];
  reply: Sent[];
  send: Sent[];
  modal: Sent[];
}

interface Opts {
  failSend?: boolean;
  noChannel?: boolean;
}

function parts(opts: Opts) {
  const calls: Calls = { update: [], reply: [], send: [], modal: [] };
  const channel = {
    send: async (m: Sent) => {
      if (opts.failSend) throw new Error("no permission");

      calls.send.push(m);
    },
  };

  return {
    calls,
    base: {
      guildId: "g",
      channel: opts.noChannel ? null : channel,
      update: async (m: Sent) => void calls.update.push(m),
      reply: async (m: Sent) => void calls.reply.push(m),
    },
  };
}

/** A button click as the handlers see it, recording what they answer. */
export function fakeClick(userId: string, opts: Opts = {}) {
  const { calls, base } = parts(opts);
  const showModal = async (m: { toJSON(): Sent }) => void calls.modal.push(m.toJSON());
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = { ...base, user: { id: userId }, showModal } as unknown as MessageComponentInteraction;

  return { i, calls };
}

/** A modal submit with the typed country. */
export function fakeModal(userId: string, text: string, opts: Opts = {}) {
  const { calls, base } = parts(opts);
  const fields = { getTextInputValue: (id: string) => (id === "country" ? text : "") };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = {
    ...base,
    user: { id: userId },
    fields,
    isFromMessage: () => true,
  } as unknown as ModalSubmitInteraction;

  return { i, calls };
}
