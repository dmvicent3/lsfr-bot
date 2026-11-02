import { describe, expect, test } from "bun:test";
import type { Interaction } from "discord.js";
import { routeInteraction } from "../../src/core/interactions.ts";
import { buildRouter } from "../../src/core/router.ts";
import type { Ctx, ModalHandler } from "../../src/core/types.ts";

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- routing never touches the ctx
const ctx = {} as Ctx;

function submit(customId: string) {
  const replies: unknown[] = [];
  const interaction = {
    customId,
    isChatInputCommand: () => false,
    isAutocomplete: () => false,
    isMessageComponent: () => false,
    isModalSubmit: () => true,
    reply: async (r: unknown) => void replies.push(r),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls routing makes
  return { interaction: interaction as unknown as Interaction, replies };
}

describe("routeInteraction modal submits", () => {
  test("routes a registered modal with its args", async () => {
    const calls: string[][] = [];
    const handler: ModalHandler = { id: "x:y", handle: async (_i, args) => void calls.push(args) };
    const router = buildRouter([{ name: "x", modals: [handler] }]);
    const { interaction, replies } = submit("x:y:1:2");
    await routeInteraction(interaction, router, ctx);
    expect(calls).toEqual([["1", "2"]]);
    expect(replies).toEqual([]);
  });

  test("answers an unknown modal with the stale reply", async () => {
    const { interaction, replies } = submit("x:nope");
    await routeInteraction(interaction, buildRouter([]), ctx);
    expect(JSON.stringify(replies)).toContain("doesn't work any more");
  });
});
