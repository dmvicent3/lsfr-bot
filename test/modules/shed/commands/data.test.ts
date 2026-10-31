import { expect, test } from "bun:test";
import { ApplicationCommandOptionType, InteractionContextType } from "discord.js";
import { data } from "../../../../src/modules/shed/commands/data.ts";

test("/shed: new, stop, leaderboard, stats; servers only; new takes a stacking boolean", () => {
  expect(data.name).toBe("shed");
  expect(data.contexts).toEqual([InteractionContextType.Guild]);
  expect(data.options?.map((o) => o.name)).toEqual(["new", "stop", "leaderboard", "stats"]);
  const created = data.options?.find((o) => o.name === "new");
  const opts = created && "options" in created ? (created.options ?? []) : [];
  expect(opts.map((o) => [o.name, o.type])).toEqual([
    ["stacking", ApplicationCommandOptionType.Boolean],
  ]);
});
