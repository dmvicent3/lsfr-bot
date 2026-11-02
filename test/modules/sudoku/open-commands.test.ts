import { expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import { daily } from "../../../src/modules/sudoku/commands/daily.ts";
import { practice } from "../../../src/modules/sudoku/commands/practice.ts";
import type { CommandCtx } from "../../../src/modules/sudoku/commands/types.ts";
import { freshDb } from "./store/fixtures.ts";

function fake() {
  const order: string[] = [];
  const sent: { deferFlags?: unknown; edited?: { components?: unknown[] } } = {};
  const i = {
    user: { id: "u" },
    options: { getString: () => "easy" },
    deferReply: async (o: { flags?: unknown }) => {
      order.push("deferReply");
      sent.deferFlags = o.flags;
    },
    editReply: async (m: { components?: unknown[] }) => {
      order.push("editReply");
      sent.edited = m;
    },
    reply: async () => void order.push("reply"),
  };

  return { i, order, sent };
}

function run(handler: typeof daily, i: ReturnType<typeof fake>["i"]) {
  const { db, repo } = freshDb();
  runMigrations(db, coreMigrations);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
  const stand = i as unknown as CommandCtx["i"];

  return handler({ i: stand, guildId: "g", db, repo, random: () => 0.5 });
}

test("practice defers privately before it sends the board", async () => {
  const { i, order, sent } = fake();
  await run(practice, i);

  expect(order).toEqual(["deferReply", "editReply"]);
  expect(sent.deferFlags).toBe(MessageFlags.Ephemeral);
  expect(sent.edited?.components?.length).toBeGreaterThan(0);
});

test("daily defers privately before it sends the board", async () => {
  const { i, order, sent } = fake();
  await run(daily, i);

  expect(order).toEqual(["deferReply", "editReply"]);
  expect(sent.deferFlags).toBe(MessageFlags.Ephemeral);
  expect(sent.edited?.components?.length).toBeGreaterThan(0);
});
