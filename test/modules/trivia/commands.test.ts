import { describe, expect, test } from "bun:test";
import { Events, InteractionContextType } from "discord.js";
import { data } from "../../../src/modules/trivia/commands/data.ts";
import { triviaModule } from "../../../src/modules/trivia/index.ts";

describe("/trivia", () => {
  test("six subcommands in a server", () => {
    expect(data.name).toBe("trivia");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    expect(data.options?.map((o) => o.name)).toEqual([
      "start",
      "stop",
      "leaderboard",
      "stats",
      "report",
      "reports",
    ]);
  });

  test("the module owns its components, events and tables", () => {
    const m = triviaModule();

    expect(m.name).toBe("trivia");
    expect(m.title).toBe("🧠 Trivia");
    expect(m.commands?.map((c) => c.data.name)).toEqual(["trivia"]);
    expect(m.components?.map((c) => c.id)).toEqual(["trivia:pick", "trivia:topic", "trivia:page"]);
    expect(m.events?.map((e) => e.event)).toEqual([Events.MessageCreate, Events.ClientReady]);
    expect(m.migrations?.map((x) => x.id)).toEqual(["trivia-001-init"]);
  });
});
