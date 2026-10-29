import { describe, expect, test } from "bun:test";
import { renderStats } from "../../../../src/modules/minesweeper/render/stats.ts";

describe("renderStats", () => {
  test("nothing finished yet", () => {
    expect(renderStats(null, "Dani")).toBe("No finished games yet.");
  });

  test("totals, then one line per setup", () => {
    const stats = {
      games: 3,
      wins: 2,
      streak: 1,
      bestStreak: 2,
      setups: [
        { label: "Beginner", games: 2, wins: 1, bestSeconds: 75 },
        { label: "6×6/3", games: 1, wins: 1, bestSeconds: 9 },
      ],
    };
    expect(renderStats(stats, "Dani")).toBe(
      [
        "**Dani** — 3 games, 2 wins (67%) · streak 1 (best 2)",
        "Beginner: best 1:15 · 1/2 won",
        "6×6/3: best 0:09 · 1/1 won",
      ].join("\n"),
    );
  });
});
