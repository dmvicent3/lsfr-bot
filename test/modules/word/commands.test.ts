import { describe, expect, test } from "bun:test";
import { type APIApplicationCommandOption, InteractionContextType } from "discord.js";
import { data } from "../../../src/modules/word/commands/data.ts";
import { modeData } from "../../../src/modules/word/commands/mode-data.ts";
import { wordModule } from "../../../src/modules/word/index.ts";

const optionNames = (sub: APIApplicationCommandOption | undefined): string[] =>
  sub && "options" in sub ? (sub.options ?? []).map((o) => o.name) : [];

const subOf = (name: string) => data.options?.find((o) => o.name === name);

describe("/word", () => {
  test("six subcommands in a server, classic only", () => {
    expect(data.name).toBe("word");
    expect(data.description).toBe("Daily word game");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(data.options?.map((o) => o.name)).toEqual([
      "play",
      "guess",
      "letters",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("stats and leaderboard no longer pick a game", () => {
    expect(optionNames(subOf("stats"))).toEqual(["user"]);
    expect(optionNames(subOf("leaderboard"))).toEqual(["period", "page"]);
  });

  test("the module owns its commands, buttons and tables", () => {
    const m = wordModule();
    expect(m.name).toBe("word");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["word", "duo", "quad"]);
    expect(m.components?.map((c) => c.id)).toEqual([
      "word:page",
      "word:duopage",
      "word:quadpage",
      "word:guess",
      "word:giveup",
    ]);
    expect(m.modals?.map((x) => x.id)).toEqual(["word:answer"]);
    expect(m.migrations?.map((x) => x.id)).toEqual(["word-001-init", "word-002-multi"]);
  });
});

describe("/duo and /quad", () => {
  test("play, letters, stats and leaderboard in a server", () => {
    for (const mode of ["duo", "quad"] as const) {
      const d = modeData(mode);
      expect(d.name).toBe(mode);
      expect(d.contexts).toEqual([InteractionContextType.Guild]);
      expect(d.options?.map((o) => o.name)).toEqual(["play", "letters", "stats", "leaderboard"]);
      expect(optionNames(d.options?.[3])).toEqual(["period", "page"]);
    }

    expect(modeData("duo").description).toBe("Word Duo: two words at once in 7 attempts");
    expect(modeData("quad").description).toBe("Word Quad: four words at once in 9 attempts");
  });
});
