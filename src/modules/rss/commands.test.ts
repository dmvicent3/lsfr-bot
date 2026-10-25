import { describe, expect, test } from "bun:test";
import {
  ApplicationCommandOptionType,
  InteractionContextType,
  PermissionFlagsBits,
} from "discord.js";
import { autocompleteChoices, rssCommand } from "./commands.ts";

function subOptions(name: string): Record<string, unknown>[] {
  const sub = rssCommand.data.options?.find((o) => o.name === name);
  return sub && "options" in sub && Array.isArray(sub.options)
    ? sub.options.map((o): Record<string, unknown> => ({ ...o }))
    : [];
}

describe("rssCommand", () => {
  const { data } = rssCommand;

  test("is a global, guild-only command for members who can manage the server", () => {
    expect(rssCommand.global).toBe(true);
    expect(data.default_member_permissions).toBe(String(PermissionFlagsBits.ManageGuild));
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
  });

  test("has the eight subcommands", () => {
    const subs = (data.options ?? []).filter(
      (o) => o.type === ApplicationCommandOptionType.Subcommand,
    );
    expect(subs.map((s) => s.name)).toEqual([
      "channel",
      "follow",
      "unfollow",
      "feeds",
      "block",
      "only",
      "remove-rule",
      "rules",
    ]);
  });

  test("limits a rule to 1-200 characters and autocompletes what is removed", () => {
    expect(subOptions("block")[0]).toMatchObject({
      name: "rule",
      required: true,
      min_length: 1,
      max_length: 200,
    });
    expect(subOptions("only")[0]).toMatchObject({ name: "rule", required: true, max_length: 200 });
    expect(subOptions("remove-rule")[0]).toMatchObject({ name: "rule", autocomplete: true });
    expect(subOptions("unfollow")[0]).toMatchObject({ name: "feed", autocomplete: true });
    expect(subOptions("follow").map((o) => o["name"])).toEqual(["url", "name"]);
  });
});

describe("autocompleteChoices", () => {
  const items = Array.from({ length: 30 }, (_, n) => ({ name: `Feed ${n}`, value: String(n) }));

  test("filters case-insensitively and caps at 25", () => {
    expect(autocompleteChoices(items, "")).toHaveLength(25);
    expect(autocompleteChoices(items, "fEeD 2").map((c) => c.value)).toEqual([
      "2",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
    ]);
  });

  test("cuts names to Discord's 100 characters", () => {
    expect(autocompleteChoices([{ name: "x".repeat(150), value: "1" }], "")[0]?.name).toHaveLength(
      100,
    );
  });
});
