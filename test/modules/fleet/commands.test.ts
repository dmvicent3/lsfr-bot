import { expect, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Ctx } from "../../../src/core/types.ts";
import { leaderboard, stats } from "../../../src/modules/fleet/commands/boards.ts";
import { data } from "../../../src/modules/fleet/commands/data.ts";
import { play } from "../../../src/modules/fleet/commands/play.ts";
import { replaceOld } from "../../../src/modules/fleet/commands/replace.ts";
import { playing, rowsFleet } from "./fixtures.ts";
import { repo, shotGame } from "./store/repo.ts";

const d = { jev: { yesNo: async () => new Map<string, number>() }, random: () => 0.9 };

function interaction(calls: string[], replies: unknown[]): ChatInputCommandInteraction {
  const fake = {
    user: { id: "u" },
    channelId: "c",
    options: { getString: () => null, getInteger: () => null, getUser: () => null },
    deferReply: async () => void calls.push("defer"),
    editReply: async () => (calls.push("edit"), { id: "m2" }),
    reply: async (r: unknown) => void replies.push(r),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the commands make
  return fake as unknown as ChatInputCommandInteraction;
}

function context(calls: string[]): Ctx {
  const fake = { client: { channels: { fetch: async () => (calls.push("fetch old"), null) } } };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only the client's channel fetch
  return fake as unknown as Ctx;
}

test("/fleet has play, stats and leaderboard", () => {
  expect(data.name).toBe("fleet");
  expect(data.options?.map((o) => o.name)).toEqual(["play", "stats", "leaderboard"]);
});

test("/fleet play acknowledges before touching the old board", async () => {
  const { repo: r } = repo();
  r.games.put({
    ...shotGame("u", { shots: 3, hits: 1, difficulty: "easy" }),
    updatedAt: Date.now(),
  });
  const calls: string[] = [];
  await play({ i: interaction(calls, []), guildId: "g", ctx: context(calls), repo: r, d });
  expect(calls).toEqual(["defer", "fetch old", "edit"]);
  const g = r.games.get("g", "u");
  expect(g?.messageId).toBe("m2");
  expect(g?.phase).toBe("placing");
  expect(g?.difficulty).toBe("normal");
  expect(r.results.stats("g", "u").levels.easy.losses).toBe(1);
});

test("replace: no player shot → removed; a shot → loss abandoned; waiting on jevos → removed", () => {
  const { repo: r } = repo();
  const now = 1_000;
  const fresh = playing({ updatedAt: now });
  r.games.put(fresh);
  expect(replaceOld(r, fresh, now)).toBe("removed");
  const shot = { ...shotGame("u", { shots: 2, hits: 0, difficulty: "hard" }), updatedAt: now };
  r.games.put(shot);
  expect(replaceOld(r, shot, now)).toBe("abandoned");
  expect(r.results.stats("g", "u").abandoned).toBe(1);
  const waiting = playing({ updatedAt: now, player: { ships: rowsFleet(), shots: [10] } });
  r.games.put(waiting);
  expect(replaceOld(r, waiting, now)).toBe("removed");
  expect(r.games.get("g", "u")).toBeNull();
  expect(r.results.stats("g", "u").abandoned).toBe(1);
});

test("stats and leaderboard reply without pinging", async () => {
  const { repo: r } = repo();
  const replies: unknown[] = [];
  const c = { i: interaction([], replies), guildId: "g", ctx: context([]), repo: r, d };
  await stats(c);
  await leaderboard(c);
  expect(replies).toHaveLength(2);

  for (const reply of replies) expect(reply).toMatchObject({ allowedMentions: { parse: [] } });
});

test("/fleet play marks the old board abandoned with its picture and deletes an old fleet message", async () => {
  const { repo: r } = repo();
  r.games.put({ ...playing({ fleetMessageId: "f", updatedAt: Date.now() }), messageId: "old" });
  const edits: { id: string; files?: { name: string }[]; attachments?: unknown[] }[] = [];
  const deletes: string[] = [];
  const channel = {
    isTextBased: () => true,
    messages: {
      edit: async (id: string, m: { files?: { name: string }[]; attachments?: unknown[] }) =>
        void edits.push({ id, ...m }),
      delete: async (id: string) => void deletes.push(id),
    },
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- only the client's channel fetch
  const ctx = { client: { channels: { fetch: async () => channel } } } as unknown as Ctx;
  await play({ i: interaction([], []), guildId: "g", ctx, repo: r, d });
  expect(edits.map((e) => [e.id, e.files?.map((f) => f.name), e.attachments])).toEqual([
    ["old", ["fleet.png"], []],
  ]);
  expect(deletes).toEqual(["f"]);
});
