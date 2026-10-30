import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { runMigrations } from "../../../src/core/db.ts";
import type { Ctx } from "../../../src/core/types.ts";
import { play } from "../../../src/modules/four/commands/play.ts";
import { fourMigrations } from "../../../src/modules/four/store/migrations.ts";
import { FourRepo } from "../../../src/modules/four/store/repo.ts";
import { board } from "./fixtures.ts";

test("/four play acknowledges before touching the old board", async () => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, fourMigrations);
  const repo = new FourRepo(db);
  const old = { guildId: "g", playerId: "u", channelId: "c", messageId: "m1" };
  const rest = {
    first: "player",
    difficulty: "easy",
    startedAt: 0,
    updatedAt: Date.now(),
  } as const;
  repo.games.put({ ...old, ...rest, board: board(["RY....."]) });
  const calls: string[] = [];
  const fakeI = {
    user: { id: "u" },
    channelId: "c",
    options: { getString: () => null },
    deferReply: async () => void calls.push("defer"),
    editReply: async () => (calls.push("edit"), { id: "m2" }),
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls play makes
  const i = fakeI as unknown as ChatInputCommandInteraction;
  const fakeCtx = {
    client: { channels: { fetch: async () => (calls.push("fetch old"), null) } },
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only the client's channel fetch
  const ctx = fakeCtx as unknown as Ctx;
  const d = { jev: { yesNo: async () => new Map() }, random: () => 0.9 };

  await play({ i, guildId: "g", ctx, repo, d });

  expect(calls).toEqual(["defer", "fetch old", "edit"]);
  expect(repo.games.get("g", "u")?.messageId).toBe("m2");
  expect(repo.results.stats("g", "u").easy.losses).toBe(1);
});
