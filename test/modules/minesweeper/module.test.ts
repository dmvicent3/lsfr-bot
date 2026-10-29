import { describe, expect, test } from "bun:test";
import { minesweeperModule } from "../../../src/modules/minesweeper/index.ts";

describe("minesweeperModule", () => {
  test("routes its menus and buttons, owns its command and table", () => {
    const m = minesweeperModule();
    expect(m.name).toBe("minesweeper");
    expect(m.title).toBe("💣 Minesweeper");
    expect(m.components?.map((c) => c.id)).toEqual([
      "minesweeper:col",
      "minesweeper:row",
      "minesweeper:reveal",
      "minesweeper:flag",
      "minesweeper:giveup",
    ]);
    expect(m.commands?.map((c) => c.data.name)).toEqual(["minesweeper"]);
    expect(m.migrations?.map((x) => x.id)).toEqual(["minesweeper-001-init"]);
  });
});
