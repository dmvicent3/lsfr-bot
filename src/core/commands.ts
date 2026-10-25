import { REST, Routes } from "discord.js";
import { isRecord, isString } from "./guards.ts";
import { log } from "./log.ts";
import type { Ctx, SlashCommand } from "./module.ts";
import { retry } from "./retry.ts";

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

function commandIdPairs(registered: unknown): [string, string][] {
  if (!Array.isArray(registered)) return [];
  return registered.flatMap((command: unknown): [string, string][] =>
    isRecord(command) && isString(command["name"]) && isString(command["id"])
      ? [[command["name"], command["id"]]]
      : [],
  );
}

/** Replaces the commands at `route` with `commands`; returns name → id of what Discord stored. */
async function put(
  rest: REST,
  route: `/${string}`,
  commands: SlashCommand[],
): Promise<[string, string][]> {
  return commandIdPairs(await rest.put(route, { body: commands.map((c) => c.data) }));
}

/** Jobs run regardless; without commands the bot is unusable, so exit and let Docker restart. */
export async function registerCommands(
  appId: string,
  commands: SlashCommand[],
  ctx: Ctx,
): Promise<void> {
  const rest = new REST().setToken(ctx.config.discordToken);
  const { guild, global } = splitCommands(commands);
  const guildRoute = Routes.applicationGuildCommands(appId, ctx.config.guildId);
  try {
    const registered = await retry(
      async () => [
        ...(await put(rest, guildRoute, guild)),
        ...(global.length > 0 ? await put(rest, Routes.applicationCommands(appId), global) : []),
      ],
      { attempts: 5, delayMs: 5_000 },
    );
    for (const [name, id] of registered) ctx.commandIds.set(name, id);
    log.info("core", `registered ${guild.length} guild and ${global.length} global commands`);
  } catch (err) {
    log.error("core", "command registration failed, exiting", err);
    process.exit(1);
  }
}
