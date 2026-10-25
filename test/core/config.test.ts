import { describe, expect, test } from "bun:test";
import { loadConfig } from "../../src/core/config.ts";

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
      jevUrl: null,
    });
  });

  test("reads an optional, trimmed JEV_URL", () => {
    const base = {
      DISCORD_TOKEN: "t",
      DISCORD_GUILD_ID: "g",
      GEMINI_API_KEY: "k",
      GEMINI_MODEL: "m",
    };
    expect(loadConfig({ ...base, JEV_URL: " http://jev:8017 " }).jevUrl).toBe("http://jev:8017");
    expect(loadConfig({ ...base, JEV_URL: "  " }).jevUrl).toBeNull();
  });
});
