import { describe, expect, test } from "bun:test";
import type { APIEmbed, ChatInputCommandInteraction } from "discord.js";
import { InteractionContextType } from "discord.js";
import type { Ctx } from "../../../src/core/types.ts";
import { data, execute } from "../../../src/modules/dailies/command.ts";
import { dailiesModule } from "../../../src/modules/dailies/index.ts";
import { freshDailiesDb } from "./fixtures.ts";

interface Reply {
  embeds?: APIEmbed[];
  flags?: unknown;
}

function run(guildId: string | null, db = freshDailiesDb()) {
  const replies: Reply[] = [];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls execute makes
  const i = {
    guildId,
    user: { id: "u", displayName: "Dan" },
    reply: async (r: Reply) => void replies.push(r),
  } as unknown as ChatInputCommandInteraction;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only db and commandIds are read
  const ctx = { db, commandIds: new Map([["duel", "42"]]) } as unknown as Ctx;

  return { replies, done: execute(i, ctx) };
}

describe("/dailies", () => {
  test("a server-only command with no options", () => {
    expect(data.name).toBe("dailies");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(dailiesModule.commands?.map((c) => c.data.name)).toEqual(["dailies"]);
    expect(dailiesModule.migrations).toBeUndefined();
  });

  test("replies publicly with the caller's checklist", async () => {
    const { replies, done } = run("g");
    await done;
    const [r] = replies;
    expect(r?.flags).toBeUndefined();
    expect(r?.embeds?.[0]?.title).toStartWith("Dan's dailies · 0/10 done");
    expect(r?.embeds?.[0]?.description).toContain("</duel play:42>");
  });

  test("outside a server it does nothing", async () => {
    const { replies, done } = run(null);
    await done;
    expect(replies).toEqual([]);
  });
});
