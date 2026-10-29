import { describe, expect, test } from "bun:test";
import { rollup } from "../../../src/modules/minesweeper/stats.ts";
import type { FinishedRow, Result, Setup } from "../../../src/modules/minesweeper/types.ts";

const BEGINNER: Setup = { width: 9, height: 9, mines: 10 };

let clockAt = 0;

/** A finished game `seconds` long, each one later than the last. */
const row = (result: Result, seconds = 60, setup: Setup = BEGINNER): FinishedRow => {
  clockAt += 1_000_000;

  return { ...setup, result, startedAt: clockAt, finishedAt: clockAt + seconds * 1000 };
};

describe("rollup", () => {
  test("no games, no stats", () => {
    expect(rollup([])).toBeNull();
  });

  test("totals and streaks", () => {
    const s = rollup([row("won"), row("won"), row("lost"), row("won")]);
    expect(s).toMatchObject({ games: 4, wins: 3, streak: 1, bestStreak: 2 });
  });

  test("a give-up breaks the streak", () => {
    expect(rollup([row("won"), row("gave-up")])).toMatchObject({ streak: 0, bestStreak: 1 });
  });

  test("best time is the fastest win, losses don't count", () => {
    const s = rollup([row("won", 90), row("lost", 5), row("won", 70)]);
    expect(s?.setups).toEqual([{ label: "Beginner", games: 3, wins: 2, bestSeconds: 70 }]);
  });

  test("setups with no win are left out", () => {
    const custom = { width: 12, height: 10, mines: 20 };
    expect(rollup([row("won"), row("lost", 5, custom)])?.setups.map((l) => l.label)).toEqual([
      "Beginner",
    ]);
  });

  test("presets first in their order, then others by games played", () => {
    const expert = { width: 20, height: 20, mines: 80 };
    const a = { width: 12, height: 10, mines: 20 };
    const b = { width: 6, height: 6, mines: 3 };
    const s = rollup([
      row("won", 60, b),
      row("won", 60, a),
      row("won", 60, a),
      row("won", 60, expert),
      row("won", 60, BEGINNER),
    ]);
    expect(s?.setups.map((l) => l.label)).toEqual(["Beginner", "Expert", "12×10/20", "6×6/3"]);
  });

  test("at most ten setups", () => {
    const rows = Array.from({ length: 12 }, (_, k) =>
      row("won", 60, { width: 5 + k, height: 5, mines: 1 }),
    );
    expect(rollup(rows)?.setups).toHaveLength(10);
  });
});
