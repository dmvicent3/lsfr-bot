import type { MessageComponentInteraction, ModalSubmitInteraction } from "discord.js";

export interface Sent {
  content?: string;
  components?: unknown[];
  allowedMentions?: unknown;
  custom_id?: string;
  flags?: unknown;
  files?: { name?: string }[];
  attachments?: unknown[];
}

export interface Calls {
  update: Sent[];
  reply: Sent[];
  send: Sent[];
  modal: Sent[];
  editReply: Sent[];
  followUp: Sent[];
  /** Every answer call in order, so a test can see the defer came first. */
  order: string[];
}

interface Opts {
  failSend?: boolean;
  noChannel?: boolean;
  noGuild?: boolean;
  notFromMessage?: boolean;
  /** The edit of the clicked message throws, as with an expired token. */
  failUpdate?: boolean;
  /** The click is not a string select. */
  notSelect?: boolean;
  /** The picked option values of a select. */
  values?: string[];
}

function parts(opts: Opts) {
  const calls: Calls = {
    update: [],
    reply: [],
    send: [],
    modal: [],
    editReply: [],
    followUp: [],
    order: [],
  };
  const channel = {
    send: async (m: Sent) => {
      if (opts.failSend) throw new Error("no permission");

      calls.send.push(m);
    },
  };

  return {
    calls,
    base: {
      guildId: opts.noGuild ? null : "g",
      channel: opts.noChannel ? null : channel,
      update: async (m: Sent) => {
        if (opts.failUpdate) throw new Error("token expired");

        calls.update.push(m);
      },
      reply: async (m: Sent) => void calls.reply.push(m),
      followUp: async (m: Sent) => void calls.followUp.push(m),
      deferUpdate: async () => void calls.order.push("deferUpdate"),
      editReply: async (m: Sent) => {
        calls.order.push("editReply");
        calls.editReply.push(m);
      },
    },
  };
}

/** A button click as the handlers see it, recording what they answer. */
export function fakeClick(userId: string, opts: Opts = {}) {
  const { calls, base } = parts(opts);
  const showModal = async (m: { toJSON(): Sent }) => void calls.modal.push(m.toJSON());
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = {
    ...base,
    user: { id: userId },
    showModal,
    values: opts.values ?? [],
    isStringSelectMenu: () => !opts.notSelect,
  } as unknown as MessageComponentInteraction;

  return { i, calls };
}

/** A modal submit with the typed text: one text every field reads, or a text per field id. */
export function fakeModal(userId: string, text: string | Record<string, string>, opts: Opts = {}) {
  const { calls, base } = parts(opts);
  const read = (id: string) => (typeof text === "string" ? text : (text[id] ?? ""));
  const fields = { getTextInputValue: read };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = {
    ...base,
    user: { id: userId },
    fields,
    isFromMessage: () => !opts.notFromMessage,
  } as unknown as ModalSubmitInteraction;

  return { i, calls };
}
