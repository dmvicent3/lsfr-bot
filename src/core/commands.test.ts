import { describe, expect, test } from "bun:test";
import { splitCommands } from "./commands.ts";
import type { SlashCommand } from "./module.ts";

function command(name: string, global?: true): SlashCommand {
  return {
    data: { name, description: name },
    execute: async () => {},
    ...(global ? { global } : {}),
  };
}

describe("splitCommands", () => {
  test("puts global commands apart from guild ones, keeping order", () => {
    const { guild, global } = splitCommands([
      command("a"),
      command("rss", true),
      command("b"),
      command("news", true),
    ]);
    expect(guild.map((c) => c.data.name)).toEqual(["a", "b"]);
    expect(global.map((c) => c.data.name)).toEqual(["rss", "news"]);
  });
});
