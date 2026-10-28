import { expect, test } from "bun:test";
import { periodRange } from "../../../../src/modules/word/periods.ts";
import { renderLeaderboard } from "../../../../src/modules/word/render/leaderboard.ts";
import type { Standing } from "../../../../src/modules/word/types.ts";

/** u1 first with the most points, down to u23. */
const LIST23: Standing[] = Array.from({ length: 23 }, (_, i) => ({
  userId: `u${i + 1}`,
  points: 1000 - i * 10,
  wins: 3,
  games: 4,
  avgAttempts: 4,
  lastFinishedAt: 1,
}));
const V = {
  period: "all" as const,
  range: periodRange("all", "2026-10-28"),
  list: LIST23,
  page: 1,
  viewerId: "u3",
};

test("page 2 of 23 players shows ranks 11-20 and the viewer's rank in the footer", () => {
  const p = renderLeaderboard({ ...V, page: 2 });
  expect(p).toMatchObject({ page: 2, pages: 3 });
  expect(p.content).toContain("**11.** <@u11>");
  expect(p.content).toContain("**20.** <@u20>");
  expect(p.content).not.toContain("**10.**");
  expect(p.content).not.toContain("**21.**");
  expect(p.content).toContain("<@u3>: #3 · 980 pts");
  expect(p.content).not.toContain("You:");
});

test("rows carry mentions, points, wins and win rate", () => {
  expect(renderLeaderboard(V).content).toContain("**1.** <@u1> — 1000 pts · 3 W · 75%");
});

test("heading names the period", () => {
  expect(renderLeaderboard(V).content).toStartWith("## 🟩 Word — all time");
});

test("a viewer who hasn't played is told so", () => {
  expect(renderLeaderboard({ ...V, viewerId: "nobody" }).content).toContain(
    "<@nobody> hasn't played this period.",
  );
});

test("an empty period says so", () => {
  expect(renderLeaderboard({ ...V, list: [] })).toMatchObject({ page: 1, pages: 1 });
  expect(renderLeaderboard({ ...V, list: [] }).content).toContain("No games yet");
});

test("a page past the end clamps", () => {
  expect(renderLeaderboard({ ...V, page: 9 }).page).toBe(3);
  expect(renderLeaderboard({ ...V, page: 0 }).page).toBe(1);
});
