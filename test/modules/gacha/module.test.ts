import { describe, expect, test } from "bun:test";
import { ApplicationCommandOptionType } from "discord.js";
import { ROSTER } from "../../../src/modules/gacha/data/roster.ts";
import { gachaModule } from "../../../src/modules/gacha/index.ts";

describe("the driver snapshot", () => {
  test("every champion is ★5, every other winner ★4, ids unique, codes two letters", () => {
    const { drivers, pools } = ROSTER;

    expect(pools[5].length).toBeGreaterThanOrEqual(34);
    expect(pools[4].length).toBeGreaterThan(70);
    expect(drivers.length).toBeGreaterThan(750);
    expect(new Set(drivers.map((d) => d.id)).size).toBe(drivers.length);
    expect(drivers.every((d) => /^[A-Z]{2}$/.test(d.country))).toBe(true);
    expect(drivers.every((d) => d.titles > 0 === (d.tier === 5))).toBe(true);
    expect(drivers.every((d) => d.tier === 5 || d.wins > 0 === (d.tier === 4))).toBe(true);
    expect(ROSTER.byId.get("senna")).toMatchObject({ tier: 5, titles: 3, country: "BR" });
  });
});

describe("gachaModule", () => {
  test("one /gacha command with its six subcommands, the weekly job and its tables", () => {
    const m = gachaModule([]);
    const subs = (m.commands?.[0]?.data.options ?? [])
      .filter((o) => o.type === ApplicationCommandOptionType.Subcommand)
      .map((o) => o.name);

    expect(m.commands?.[0]?.data.name).toBe("gacha");
    expect(subs).toEqual(["pull", "banner", "balance", "collection", "history", "settings"]);
    expect(m.jobs?.map((j) => j.cron)).toEqual(["*/5 * * * *"]);
    expect(m.migrations?.[0]?.id).toBe("gacha-001-init");
    expect(m.helpNote).toContain(`${ROSTER.drivers.length} F1 drivers`);
  });
});
