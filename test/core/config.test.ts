import { describe, expect, test } from "bun:test";
import { loadConfig } from "../../src/core/config.ts";

const base = { DISCORD_TOKEN: "t", DISCORD_GUILD_ID: "g" };

describe("loadConfig", () => {
  test("names every missing required variable", () => {
    expect(() => loadConfig({})).toThrow(/DISCORD_TOKEN.*DISCORD_GUILD_ID/);
  });

  test("needs only the Discord token and server; the rest defaults", () => {
    expect(loadConfig(base)).toEqual({
      discordToken: "t",
      guildId: "g",
      databasePath: "./data/gork.db",
      jevUrl: null,
      embedUrl: null,
      llmUrl: null,
      searchUrl: null,
    });
  });

  test("reads the optional service URLs, trimmed; blank is unset", () => {
    const env = {
      ...base,
      JEV_URL: " http://jev:8017 ",
      EMBED_URL: " http://embed:8018 ",
      LLM_URL: " http://llm:8019 ",
      SEARCH_URL: " http://search:8080 ",
    };
    expect(loadConfig(env)).toMatchObject({
      jevUrl: "http://jev:8017",
      embedUrl: "http://embed:8018",
      llmUrl: "http://llm:8019",
      searchUrl: "http://search:8080",
    });
    expect(loadConfig({ ...base, LLM_URL: "  ", SEARCH_URL: "" })).toMatchObject({
      llmUrl: null,
      searchUrl: null,
    });
  });
});
