import { describe, expect, test } from "bun:test";
import {
  applyFlag,
  applyGiveUp,
  applyReveal,
  isStarted,
  moveCursor,
  startGame,
} from "../../../src/modules/minesweeper/moves.ts";
import type { Game, Setup } from "../../../src/modules/minesweeper/types.ts";
import { game, seeded } from "./fixtures.ts";

const fresh = (setup: Setup): Game => ({
  ...startGame({ guildId: "g", channelId: "c", playerId: "u", setup, now: 500 }),
  id: 1,
});

describe("startGame", () => {
  test("cursor at the centre, everything hidden, nothing laid", () => {
    const g = fresh({ width: 9, height: 9, mines: 10 });
    expect(g.cursor).toBe(40);
    expect(g.cells).toHaveLength(81);
    expect(g.cells.every((c) => c === "hidden")).toBe(true);
    expect(g.field).toBeNull();
    expect(g.createdAt).toBe(500);
    expect(isStarted(g)).toBe(false);
  });
});

describe("moveCursor", () => {
  test("a column pick keeps the row", () => {
    expect(moveCursor(fresh({ width: 9, height: 9, mines: 10 }), "col", 0).cursor).toBe(36);
  });

  test("a row pick keeps the column", () => {
    expect(moveCursor(fresh({ width: 9, height: 9, mines: 10 }), "row", 8).cursor).toBe(76);
  });
});

describe("applyReveal", () => {
  test("the first reveal lays mines, starts the clock and opens the cursor", () => {
    const { game: g, hint } = applyReveal(fresh({ width: 9, height: 9, mines: 10 }), 2_000, seeded(5));
    expect(hint).toBeNull();
    expect(g.field?.filter(Boolean)).toHaveLength(10);
    expect(g.startedAt).toBe(2_000);
    expect(g.cells[40]).toBe("open");
    expect(g.result).toBeNull();
  });

  test("max mines: the first reveal floods the zone and wins", () => {
    const { game: g } = applyReveal(fresh({ width: 5, height: 5, mines: 16 }), 2_000, seeded(1));
    expect(g.result).toBe("won");
    expect(g.finishedAt).toBe(2_000);
    expect(g.cells.filter((c) => c === "flag")).toHaveLength(16);
  });

  test("a mine loses and records the hit", () => {
    const { game: g } = applyReveal(game(["*..", "...", "..."]), 9_000, seeded(1));
    expect(g.result).toBe("lost");
    expect(g.hit).toBe(0);
    expect(g.finishedAt).toBe(9_000);
  });

  test("a later reveal keeps the start time", () => {
    const { game: g } = applyReveal(game(["*..", "...", "..."], { cursor: 8 }), 9_000, seeded(1));
    expect(g.startedAt).toBe(1_000);
    expect(g.result).toBe("won");
  });

  test("a hint leaves the game as it was", () => {
    const g = game(["*f.", "...", "..."], { cursor: 1 });
    const step = applyReveal(g, 9_000, seeded(1));
    expect(step.hint).toBe("Flagged — remove the flag to reveal it.");
    expect(step.game).toBe(g);
  });
});

describe("applyFlag", () => {
  test("flags the cursor cell", () => {
    expect(applyFlag(game(["*..", "...", "..."])).game.cells[0]).toBe("flag");
  });

  test("an open cell gives a hint and the same game", () => {
    const g = game(["o*.", "...", "..."]);
    const step = applyFlag(g);
    expect(step.hint).toBe("That cell is already open.");
    expect(step.game).toBe(g);
  });
});

describe("applyGiveUp", () => {
  test("finishes as gave-up now", () => {
    const g = applyGiveUp(game(["*..", "...", "..."]), 7_000);
    expect(g.result).toBe("gave-up");
    expect(g.finishedAt).toBe(7_000);
  });
});
