import { expect, test } from "bun:test";
import type { MessageComponentInteraction } from "discord.js";
import { leaderboardView } from "../../src/core/leaderboard-view.ts";
import { pageHandler } from "../../src/core/page-handler.ts";
import type { Ctx } from "../../src/core/types.ts";

interface Row {
  userId: string;
  points: number;
}

const NOW = Date.UTC(2026, 10, 4, 12);
const ranges = {
  today: { from: "2026-11-04", to: "2026-11-04", label: "today" },
  week: { from: "2026-11-02", to: "2026-11-08", label: "this week" },
};
const seen: string[] = [];
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the kit never reads the database
const db = {} as Ctx["db"];

const view = leaderboardView<number, Row, Row>({
  prefix: "x:page",
  timeZone: () => "UTC",
  periodRange: (period, today) => {
    seen.push(today);

    return period === "week" ? ranges.week : ranges.today;
  },
  games: (n) => Array.from({ length: n }, (_, k) => ({ userId: `u${k}`, points: 10 - k })),
  standings: (list) => list,
  render: (v) => ({
    content: `${v.range.label}: ${v.list.length} rows, page ${v.page}`,
    page: v.page,
    pages: v.list.length > 1 ? 3 : 1,
  }),
});
const ask = { guildId: "g", viewerId: "u", now: NOW, page: 2 };

test("the view is rendered for the range of the server's today, silent on mentions", () => {
  const out = view(db, 3, { ...ask, period: "week" });

  expect(seen.at(-1)).toBe("2026-11-04");
  expect(out.content).toBe("this week: 3 rows, page 2");
  expect(out.allowedMentions).toEqual({ parse: [] });
});

test("page buttons carry the prefix and period, and none for one page", () => {
  const out = view(db, 3, { ...ask, period: "today" });
  const ids = JSON.stringify(out.components);

  expect(ids).toContain("x:page:today:1");
  expect(ids).toContain("x:page:today:3");
  expect(view(db, 1, { ...ask, period: "today" }).components).toEqual([]);
});

function click(args: string[]) {
  const updates: { content?: string }[] = [];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = {
    guildId: "g",
    user: { id: "u" },
    update: async (m: { content?: string }) => void updates.push(m),
  } as unknown as MessageComponentInteraction;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the context
  const ctx = { db } as unknown as Ctx;

  return { run: () => handler.handle(i, args, ctx), updates };
}

const handler = pageHandler("x:page", () => 3, view);

test("the page handler updates in place with the requested period and page", async () => {
  const week = click(["week", "3"]);
  await week.run();
  const today = click(["today", "1"]);
  await today.run();

  expect(handler.id).toBe("x:page");
  expect(week.updates[0]?.content).toBe("this week: 3 rows, page 3");
  expect(today.updates[0]?.content).toBe("today: 3 rows, page 1");
});

test("the page handler ignores a click outside a server", async () => {
  const updates: unknown[] = [];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls act makes
  const i = {
    guildId: null,
    user: { id: "u" },
    update: async (m: unknown) => void updates.push(m),
  } as unknown as MessageComponentInteraction;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the context
  await handler.handle(i, ["week", "1"], { db } as unknown as Ctx);

  expect(updates).toHaveLength(0);
});
