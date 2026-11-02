import { expect, test } from "bun:test";
import { periodRange } from "../../../../src/modules/sudoku/periods.ts";
import { renderLeaderboard } from "../../../../src/modules/sudoku/render/leaderboard.ts";
import type { Standing } from "../../../../src/modules/sudoku/types.ts";

const LIST23: Standing[] = Array.from({ length: 23 }, (_, i) => ({
  userId: `u${i + 1}`,
  points: 1000 - i * 10,
  solved: 3,
  lastSolvedAt: 1,
}));
const V = {
  period: "all" as const,
  range: periodRange("all", "2026-11-05"),
  list: LIST23,
  page: 1,
  viewerId: "u3",
};

test("page 2 of 23 shows ranks 11-20 and the viewer in the footer", () => {
  const p = renderLeaderboard({ ...V, page: 2 });
  expect(p).toMatchObject({ page: 2, pages: 3 });
  expect(p.content).toContain("**11.** <@u11>");
  expect(p.content).toContain("**20.** <@u20>");
  expect(p.content).not.toContain("**10.**");
  expect(p.content).toContain("<@u3>: #3 · 980 pts");
  expect(p.content).toContain("Page 2/3");
});

test("rows carry mentions, points and solved count", () => {
  expect(renderLeaderboard(V).content).toContain("**1.** <@u1> — 1000 pts · 3 solved");
});

test("heading names the range", () => {
  expect(renderLeaderboard(V).content).toStartWith("## 🔢 Sudoku — all time");
});

test("empty list and a viewer who hasn't played", () => {
  expect(renderLeaderboard({ ...V, list: [] }).content).toBe(
    "## 🔢 Sudoku — all time\nNo puzzles solved yet. Play with `/sudoku daily`.",
  );
  expect(renderLeaderboard({ ...V, viewerId: "zz" }).content).toContain(
    "<@zz> hasn't played this period.",
  );
});

test("page is clamped", () => {
  expect(renderLeaderboard({ ...V, page: 99 }).page).toBe(3);
});
