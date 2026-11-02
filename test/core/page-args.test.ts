import { expect, test } from "bun:test";
import type { MessageComponentInteraction } from "discord.js";
import { pageArgs, pageRequest, toPeriod } from "../../src/core/page-args.ts";

const click = (guildId: string | null) =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the two fields read
  ({ guildId, user: { id: "u" } }) as unknown as MessageComponentInteraction;

test("toPeriod reads a period and falls back to today", () => {
  expect(toPeriod("month")).toBe("month");
  expect(toPeriod("year")).toBe("today");
  expect(toPeriod(null)).toBe("today");
  expect(toPeriod(undefined)).toBe("today");
});

test("pageArgs reads leniently", () => {
  expect(pageArgs(["week", "2"])).toEqual({ period: "week", page: 2 });
  expect(pageArgs(["year", "x"])).toEqual({ period: "today", page: 1 });
  expect(pageArgs(["week", "1.5"])).toEqual({ period: "week", page: 1 });
  expect(pageArgs([])).toEqual({ period: "today", page: 1 });
});

test("pageRequest names the server, viewer and now; none outside a server", () => {
  const before = Date.now();
  const r = pageRequest(click("g"), ["all", "3"]);

  expect(r).toMatchObject({ period: "all", page: 3, guildId: "g", viewerId: "u" });
  expect(r?.now).toBeGreaterThanOrEqual(before);
  expect(pageRequest(click(null), [])).toBeNull();
});
