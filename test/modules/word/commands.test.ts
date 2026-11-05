import { describe, expect, test } from "bun:test";
import { InteractionContextType } from "discord.js";
import { data } from "../../../src/modules/word/commands/data.ts";
import { wordModule } from "../../../src/modules/word/index.ts";

describe("/word", () => {
  test("eight subcommands in a server", () => {
    expect(data.name).toBe("word");
    expect(data.description).toBe("Daily word game");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(data.options?.map((o) => o.name)).toEqual([
      "play",
      "guess",
      "letters",
      "duo",
      "quad",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("the module owns its button and table", () => {
    const m = wordModule();
    expect(m.name).toBe("word");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["word"]);
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

test("stats and leaderboard pick a game, classic by default", () => {
  for (const name of ["stats", "leaderboard"]) {
    const sub = data.options?.find((o) => o.name === name);
    const mode = JSON.stringify(sub).includes('"name":"mode"');
    expect(mode).toBe(true);
  }
});
