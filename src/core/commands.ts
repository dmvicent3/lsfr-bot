import type { SlashCommand } from "./module.ts";

/** Global commands are registered for every server the bot is in; the rest for config.guildId only. */
export function splitCommands(commands: SlashCommand[]): {
  guild: SlashCommand[];
  global: SlashCommand[];
} {
  return {
    guild: commands.filter((c) => !c.global),
    global: commands.filter((c) => c.global),
  };
}
