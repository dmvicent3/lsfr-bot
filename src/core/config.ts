import type { Config } from "./types.ts";

export class ConfigError extends Error {
  override name = "ConfigError";
}

const REQUIRED = ["DISCORD_TOKEN", "DISCORD_GUILD_ID"] as const;

/** A set, non-blank variable, trimmed; otherwise null. */
const optional = (env: Record<string, string | undefined>, name: string): string | null =>
  env[name]?.trim() || null;

export function loadConfig(env: Record<string, string | undefined>): Config {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());

  if (missing.length > 0) {
    throw new ConfigError(`Missing environment variables: ${missing.join(", ")}`);
  }

  const value = (name: (typeof REQUIRED)[number]): string => env[name]?.trim() ?? "";

  return {
    discordToken: value("DISCORD_TOKEN"),
    guildId: value("DISCORD_GUILD_ID"),
    databasePath: optional(env, "DATABASE_PATH") ?? "./data/gork.db",
    jevUrl: optional(env, "JEV_URL"),
    embedUrl: optional(env, "EMBED_URL"),
    llmUrl: optional(env, "LLM_URL"),
    searchUrl: optional(env, "SEARCH_URL"),
  };
}
