import { expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { statsHandler } from "../../src/core/stats-command.ts";

const asker = { id: "me", displayName: "Me" };
const other = { id: "o", displayName: "Other" };

function fake(picked: unknown, sent: unknown[]) {
  const i = {
    user: asker,
    options: { getUser: (name: string) => (name === "user" ? picked : null) },
    reply: async (r: unknown) => void sent.push(r),
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handler makes
  return i as unknown as ChatInputCommandInteraction;
}

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the db is only passed through
const db = "db" as never;

type Games = { userId: string }[];

function handler() {
  return statsHandler<string, Games, string>({
    timeZone: () => "Europe/Lisbon",
    periodRange: (p, today) => ({ from: today, to: p, label: p }),
    finishedIn: (_r, _g, range) => (range.to === "all" ? [{ userId: "o" }] : []),
    finishedBy: (_r, g, u) => [{ userId: `${g}/${u}` }],
    standings: (games) => games,
    playerStats: (games) => `stats:${games.map((x) => x.userId).join()}`,
    renderStats: (name, stats, ranks) => `${name}|${stats}|${ranks.all}|${ranks.today}`,
  });
}

test("the asked user's stats and ranks, private and mention-free", async () => {
  const sent: unknown[] = [];
  await handler()({ i: fake(other, sent), guildId: "g", db, repo: "r" });
  expect(sent).toEqual([
    {
      content: "Other|stats:g/o|1|null",
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    },
  ]);
});

test("no user option is the asker", async () => {
  const sent: { content?: string }[] = [];
  await handler()({ i: fake(null, sent), guildId: "g", db, repo: "r" });
  expect(sent[0]?.content).toBe("Me|stats:g/me|null|null");
});
