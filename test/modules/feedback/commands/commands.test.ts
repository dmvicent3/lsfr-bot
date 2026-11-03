import { expect, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { feedbackCommand } from "../../../../src/modules/feedback/commands/commands.ts";
import { pollChannel } from "../../../../src/modules/feedback/settings.ts";
import { setup } from "../setup.ts";

interface Opts {
  sub: string;
  guildId?: string | null;
  manageServer?: boolean;
}

interface ModalJson {
  custom_id?: string;
  title?: string;
}

function fakeCommand(o: Opts) {
  const replies: string[] = [];
  const modals: ModalJson[] = [];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const i = {
    deferred: false,
    guildId: o.guildId === undefined ? "g" : o.guildId,
    memberPermissions: { has: () => o.manageServer ?? false },
    options: {
      getSubcommand: () => o.sub,
      getString: () => "crossword",
      getChannel: () => ({ id: "c9" }),
    },
    reply: async (body: { content: string }) => void replies.push(body.content),
    showModal: async (m: { toJSON(): ModalJson }) => void modals.push(m.toJSON()),
  } as unknown as ChatInputCommandInteraction;

  return { i, replies, modals };
}

const command = feedbackCommand(["crossword", "other"]);

test("give opens the form for the topic", async () => {
  const { ctx } = setup();
  const { i, modals } = fakeCommand({ sub: "give" });
  await command.execute(i, ctx);

  expect(modals.map((m) => [m.custom_id, m.title])).toEqual([
    ["feedback:give:crossword", "Feedback · crossword"],
  ]);
});

test("the topic choices are the given topics", () => {
  const give = command.data.options?.find((o) => o.name === "give");

  expect(JSON.stringify(give)).toContain(
    JSON.stringify([
      { name: "crossword", value: "crossword" },
      { name: "other", value: "other" },
    ]),
  );
});

test("settings sets the poll channel for Manage Server only", async () => {
  const { ctx, db } = setup();
  const refused = fakeCommand({ sub: "settings" });
  await command.execute(refused.i, ctx);
  expect(refused.replies).toEqual([
    "Only members with Manage Server can change the feedback settings.",
  ]);
  expect(pollChannel(db, "g")).toBeNull();

  const admin = fakeCommand({ sub: "settings", manageServer: true });
  await command.execute(admin.i, ctx);
  expect(admin.replies).toEqual(["Polls will be posted in <#c9>."]);
  expect(pollChannel(db, "g")).toBe("c9");
});

test("outside a server", async () => {
  const { ctx } = setup();
  const { i, replies, modals } = fakeCommand({ sub: "give", guildId: null });
  await command.execute(i, ctx);

  expect(replies).toEqual(["Feedback works in a server."]);
  expect(modals).toEqual([]);
});
