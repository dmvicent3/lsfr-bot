import { expect, test } from "bun:test";
import { ApplicationCommandOptionType } from "discord.js";
import type { BotModule } from "../../core/module.ts";
import { helpText } from "./index.ts";

const noop = async (): Promise<void> => {};

test("lists commands and subcommands from every module", () => {
  const modules: BotModule[] = [
    {
      name: "motorsport",
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
              {
                type: ApplicationCommandOptionType.Subcommand,
                name: "pings",
                description: "Pings",
              },
            ],
          },
          execute: noop,
        },
      ],
    },
    { name: "help", commands: [{ data: { name: "help", description: "Help" }, execute: noop }] },
  ];
  const text = helpText(modules);
  expect(text).toContain("/motorsport follow — Follow");
  expect(text).toContain("/motorsport pings — Pings");
  expect(text).toContain("/help — Help");
});
