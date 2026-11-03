import { expect, test } from "bun:test";
import { fakeModal, type Sent } from "../../../core/fake-interaction.ts";
import { giveHandler } from "../../../../src/modules/feedback/modals/give.ts";
import { setup } from "../setup.ts";

/** A submit whose public reply lands as message m1 in channel c1. */
function submit(text: string, opts: { noGuild?: boolean } = {}) {
  const { i, calls } = fakeModal("u1", text, opts);
  Object.assign(i, {
    reply: async (m: Sent) => {
      calls.reply.push(m);

      return { resource: { message: { id: "m1", channelId: "c1" } } };
    },
  });

  return { i, calls };
}

test("feedback is stored and posted publicly with Edit and Remove", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = submit("  Make the grid bigger  ");
  await giveHandler.handle(i, ["crossword"], ctx);

  const [entry] = repo.entries.list({ all: true, topic: null });
  expect(entry).toMatchObject({
    guildId: "g",
    userId: "u1",
    topic: "crossword",
    text: "Make the grid bigger",
    channelId: "c1",
    messageId: "m1",
  });
  expect(calls.reply).toHaveLength(1);
  expect(calls.reply[0]?.flags).toBeUndefined();
  expect(calls.reply[0]?.allowedMentions).toEqual({ parse: [] });
  expect(calls.reply[0]?.content).toBe(
    "💬 **Feedback · crossword** from <@u1>\nMake the grid bigger",
  );
  expect(JSON.stringify(calls.reply[0]?.components)).toContain(`feedback:remove:${entry?.id}`);
});

test("outside a server nothing is stored", async () => {
  const { ctx, repo } = setup();
  const { i, calls } = submit("Make the grid bigger", { noGuild: true });
  await giveHandler.handle(i, ["crossword"], ctx);

  expect(repo.entries.list({ all: true, topic: null })).toEqual([]);
  expect(calls.reply[0]?.content).toBe("Feedback works in a server.");
});
