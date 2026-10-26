import type { Config } from "./types.ts";

export class ConfigError extends Error {
  override name = "ConfigError";
}

const REQUIRED = ["DISCORD_TOKEN", "DISCORD_GUILD_ID", "GEMINI_API_KEY", "GEMINI_MODEL"] as const;

export function loadConfig(env: Record<string, string | undefined>): Config {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());

  if (missing.length > 0) {
    throw new ConfigError(`Missing environment variables: ${missing.join(", ")}`);
  }

  const value = (name: (typeof REQUIRED)[number]): string => env[name]?.trim() ?? "";

  return {
    discordToken: value("DISCORD_TOKEN"),
    guildId: value("DISCORD_GUILD_ID"),
    geminiApiKey: value("GEMINI_API_KEY"),
    geminiModel: value("GEMINI_MODEL"),
    databasePath: env["DATABASE_PATH"]?.trim() || "./data/gork.db",
    jevUrl: env["JEV_URL"]?.trim() || null,
  };
}
