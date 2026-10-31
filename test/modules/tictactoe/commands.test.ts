import { describe, expect, test } from "bun:test";
import { InteractionContextType } from "discord.js";
import type { Jev } from "../../../src/core/jev/types.ts";
import { data } from "../../../src/modules/tictactoe/commands/data.ts";
import { tictactoeModule } from "../../../src/modules/tictactoe/index.ts";

const JEV: Jev = { yesNo: async () => new Map() };

describe("/tictactoe", () => {
  test("a server command with an optional difficulty", () => {
    expect(data.name).toBe("tictactoe");
    expect(data.description).toBe("Play tic-tac-toe against jevos");
    expect(data.contexts).toEqual([InteractionContextType.Guild]);
    const [level] = data.options ?? [];
    expect(level).toMatchObject({ name: "difficulty", required: false });
    expect(level && "choices" in level ? level.choices?.map((c) => c.value) : []).toEqual([
      "easy",
      "normal",
      "hard",
    ]);
  });

  test("the module routes its two buttons and owns its table", () => {
    const m = tictactoeModule(JEV);
    expect(m.components?.map((c) => c.id)).toEqual(["tictactoe:move", "tictactoe:resign"]);
    expect(m.commands?.map((c) => c.data.name)).toEqual(["tictactoe"]);
    expect(m.migrations?.map((x) => x.id)).toEqual([
      "tictactoe-001-init",
      "tictactoe-002-difficulty",
    ]);
  });
});
