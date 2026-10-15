import { describe, expect, test } from "bun:test";
import { loadConfig } from "./config.ts";

describe("loadConfig", () => {
  test("names every missing required variable", () => {
    expect(() => loadConfig({})).toThrow(
      /DISCORD_TOKEN.*DISCORD_GUILD_ID.*GEMINI_API_KEY.*GEMINI_MODEL/,
    );
  });

  test("defaults the database path", () => {
    const config = loadConfig({
      DISCORD_TOKEN: "t",
      DISCORD_GUILD_ID: "g",
      GEMINI_API_KEY: "k",
      GEMINI_MODEL: "m",
    });
    expect(config).toEqual({
      discordToken: "t",
      guildId: "g",
      geminiApiKey: "k",
      geminiModel: "m",
      databasePath: "./data/gork.db",
    });
  });
});
