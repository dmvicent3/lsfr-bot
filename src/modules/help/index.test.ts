import { expect, test } from "bun:test";
import { ApplicationCommandOptionType } from "discord.js";
import type { BotModule } from "../../core/types.ts";
import { helpEmbed } from "./index.ts";

const noop = async (): Promise<void> => {};

const modules: BotModule[] = [
  {
    name: "motorsport",
    title: "🏁 Motorsport",
    commands: [
      {
        data: {
          name: "motorsport",
          description: "Motorsport",
          options: [
            {
              type: ApplicationCommandOptionType.Subcommand,
              name: "follow",
              description: "Follow",
            },
            { type: ApplicationCommandOptionType.Subcommand, name: "pings", description: "Pings" },
          ],
        },
        execute: noop,
      },
    ],
  },
  { name: "chat", title: "💬 Chat", helpNote: "Mention the bot to chat." },
  {
    name: "help",
    title: "❓ Help",
    commands: [{ data: { name: "help", description: "Help" }, execute: noop }],
  },
];

test("groups commands by module with clickable mentions", () => {
  const embed = helpEmbed(modules, new Map([["motorsport", "111"]]));
  const text = embed.description ?? "";
  expect(embed.title).toBe("Gork commands");
  expect(text).toContain(
    "### 🏁 Motorsport\n</motorsport follow:111> · Follow\n</motorsport pings:111> · Pings",
  );
  expect(text).toContain("### 💬 Chat\nMention the bot to chat.");
  expect(text).toContain("### ❓ Help\n`/help` · Help");
});
