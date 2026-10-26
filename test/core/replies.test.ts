import { describe, expect, test } from "bun:test";
import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { autocompleteChoices, reply } from "../../src/core/replies.ts";

function fakeInteraction(deferred: boolean) {
  const calls: { method: string; body: unknown }[] = [];
  const i = {
    deferred,
    reply: async (body: unknown) => void calls.push({ method: "reply", body }),
    editReply: async (body: unknown) => void calls.push({ method: "editReply", body }),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the two calls reply makes
  return { i: i as unknown as ChatInputCommandInteraction, calls };
}

describe("reply", () => {
  test("replies ephemerally, pinging no one", async () => {
    const { i, calls } = fakeInteraction(false);
    await reply(i, "hi @everyone");
    expect(calls).toEqual([
      {
        method: "reply",
        body: {
          content: "hi @everyone",
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        },
      },
    ]);
  });

  test("edits the deferred reply", async () => {
    const { i, calls } = fakeInteraction(true);
    await reply(i, "done");
    expect(calls).toEqual([
      { method: "editReply", body: { content: "done", allowedMentions: { parse: [] } } },
    ]);
  });
});

describe("autocompleteChoices", () => {
  const items = Array.from({ length: 30 }, (_, n) => ({ name: `Feed ${n}`, value: String(n) }));

  test("filters case-insensitively and caps at 25", () => {
    expect(autocompleteChoices(items, "")).toHaveLength(25);
    expect(autocompleteChoices(items, "fEeD 2").map((c) => c.value)).toEqual([
      "2",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
    ]);
  });

  test("cuts names to Discord's 100 characters", () => {
    expect(autocompleteChoices([{ name: "x".repeat(150), value: "1" }], "")[0]?.name).toHaveLength(
      100,
    );
  });
});
