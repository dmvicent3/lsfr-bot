import { expect, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { leaderboardHandler } from "../../src/core/leaderboard-command.ts";

function fake(period: string | null, page: number | null, sent: unknown[]) {
  const i = {
    user: { id: "u" },
    options: { getString: () => period, getInteger: () => page },
    reply: async (r: unknown) => void sent.push(r),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handler makes
  return i as unknown as ChatInputCommandInteraction;
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the db is only passed through
const db = "db" as never;

test("reads period and page, sends the module's view of them", async () => {
  const seen: unknown[] = [];
  const sent: unknown[] = [];
  const handler = leaderboardHandler((d, repo: string, v) => {
    seen.push({ d, repo, ...v, now: typeof v.now });

    return { content: "page" };
  });
  await handler({ i: fake("week", 2, sent), guildId: "g", db, repo: "repo" });
  expect(seen).toEqual([
    { d: "db", repo: "repo", guildId: "g", period: "week", page: 2, viewerId: "u", now: "number" },
  ]);
  expect(sent).toEqual([{ content: "page" }]);
});

test("no options is today's first page", async () => {
  const seen: unknown[] = [];
  const handler = leaderboardHandler((_d, _repo: string, v) => {
    seen.push([v.period, v.page]);

    return { content: "" };
  });
  await handler({ i: fake(null, null, []), guildId: "g", db, repo: "r" });
  expect(seen).toEqual([["today", 1]]);
});
