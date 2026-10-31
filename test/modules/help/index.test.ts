import { expect, test } from "bun:test";
import { ApplicationCommandOptionType } from "discord.js";
import type { BotModule } from "../../../src/core/types.ts";
import { helpPages, pack } from "../../../src/modules/help/index.ts";

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
  const pages = helpPages(modules, new Map([["motorsport", "111"]]));
  expect(pages).toHaveLength(1);
  const text = pages[0]?.description ?? "";
  expect(pages[0]?.title).toBe("Gork commands");
  expect(text).toContain(
    "### 🏁 Motorsport\n</motorsport follow:111> · Follow\n</motorsport pings:111> · Pings",
  );
  expect(text).toContain("### 💬 Chat\nMention the bot to chat.");
  expect(text).toContain("### ❓ Help\n`/help` · Help");
});

test("pack keeps whole sections and starts a new page past the limit", () => {
  expect(pack(["a".repeat(5), "b".repeat(5), "c".repeat(5)], 12)).toEqual([
    "aaaaa\n\nbbbbb",
    "ccccc",
  ]);
});

test("a long list splits into numbered pages, each within Discord's limits", () => {
  const many: BotModule[] = Array.from({ length: 12 }, (_, n) => ({
    name: `m${n}`,
    helpNote: "x".repeat(500),
  }));
  const pages = helpPages(many, new Map());
  expect(pages.length).toBeGreaterThan(1);
  expect(pages[0]?.title).toBe(`Gork commands (1/${pages.length})`);

  for (const p of pages) expect(JSON.stringify(p).length).toBeLessThan(4096);
});
