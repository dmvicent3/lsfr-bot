import { describe, expect, test } from "bun:test";
import { ComponentType } from "discord.js";
import { headline, renderBoard } from "../../../../src/modules/minesweeper/render/board.ts";
import { controls } from "../../../../src/modules/minesweeper/render/controls.ts";
import { game } from "../fixtures.ts";

const NINE = Array.from({ length: 9 }, () => ".........");

describe("headline", () => {
  test("live: mines, flags placed and time so far", () => {
    expect(headline(game(["*f.", "F..", "..."]), 66_000)).toBe("💣 2 · ⚑ 2 · ⏱ 1:05");
  });

  test("before the first reveal the clock reads 0:00", () => {
    expect(headline(game(["*..", "...", "..."], { startedAt: null }), 66_000)).toBe(
      "💣 1 · ⚑ 0 · ⏱ 0:00",
    );
  });

  test("finished games say how they ended", () => {
    const at = { finishedAt: 66_000 };
    expect(headline(game(["F"], { ...at, result: "won" }), 0)).toBe("🏆 Won in 1:05");
    expect(headline(game(["*"], { ...at, result: "lost" }), 0)).toBe("💥 Lost after 1:05");
    expect(headline(game(["*"], { ...at, result: "gave-up" }), 0)).toBe("🏳️ Gave up after 1:05");
  });
});

describe("controls", () => {
  const rows = controls(game(NINE, { cursor: 40 }));

  test("column menu, row menu, then the three buttons", () => {
    const ids = rows.map((r) => r.components.map((c) => ("custom_id" in c ? c.custom_id : "")));
    expect(ids).toEqual([
      ["minesweeper:col"],
      ["minesweeper:row"],
      ["minesweeper:reveal", "minesweeper:flag", "minesweeper:giveup"],
    ]);
  });

  test("the menus list each column and row, the cursor's preselected", () => {
    const [col, row] = rows.map((r) => r.components[0]);

    if (col?.type !== ComponentType.StringSelect || row?.type !== ComponentType.StringSelect) {
      throw new Error("menus expected");
    }

    expect(col.options.map((o) => o.label)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
    expect(col.options.find((o) => o.default)?.value).toBe("4");
    expect(row.options.map((o) => o.label)[8]).toBe("9");
    expect(row.options.find((o) => o.default)?.value).toBe("4");
  });
});

describe("renderBoard", () => {
  test("a live board: title, player, headline over the grid, controls", () => {
    const view = renderBoard(game(NINE, { cursor: 40 }), { playerName: "Dani", now: 1_000 });
    const [embed] = view.embeds;
    expect(embed?.title).toBe("💣 Minesweeper — 9×9");
    expect(embed?.author?.name).toBe("Dani");
    expect(embed?.description?.startsWith("💣 0 · ⚑ 0 · ⏱ 0:00\n```ansi\n")).toBe(true);
    expect(view.components).toHaveLength(3);
  });

  test("a finished board has no controls", () => {
    const view = renderBoard(game(["*"], { result: "lost", finishedAt: 2_000 }), {
      playerName: "Dani",
      now: 0,
    });
    expect(view.components).toEqual([]);
  });

  test("a note goes in the footer and closes the board", () => {
    const view = renderBoard(game(NINE), {
      playerName: "Dani",
      now: 0,
      note: "Replaced by a new game.",
    });
    expect(view.embeds[0]?.footer?.text).toBe("Replaced by a new game.");
    expect(view.components).toEqual([]);
  });
});
