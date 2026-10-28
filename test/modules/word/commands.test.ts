import { describe, expect, test } from "bun:test";
import { InteractionContextType } from "discord.js";
import { data } from "../../../src/modules/word/commands/data.ts";
import { wordModule } from "../../../src/modules/word/index.ts";

describe("/word", () => {
  test("five subcommands in a server", () => {
    expect(data.name).toBe("word");
    expect(data.description).toBe("Daily word game");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(data.options?.map((o) => o.name)).toEqual([
      "play",
      "guess",
      "stats",
      "leaderboard",
      "settings",
    ]);
  });

  test("the module owns its button and table", () => {
    const m = wordModule();
    expect(m.name).toBe("word");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["word"]);
    expect(m.components?.map((c) => c.id)).toEqual(["word:page"]);
    expect(m.migrations?.map((x) => x.id)).toEqual(["word-001-init"]);
  });
});
