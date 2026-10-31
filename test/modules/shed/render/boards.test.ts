import { expect, test } from "bun:test";
import { renderLeaderboard, renderStats } from "../../../../src/modules/shed/render/boards.ts";

const range = { from: "2026-10-26", to: "2026-11-02", label: "this week" };

test("leaderboard: points, rank of the viewer, empty state", () => {
  const list = [
    { userId: "a", points: 5 },
    { userId: "b", points: 2 },
  ];
  const r = renderLeaderboard({ range, list, page: 1, viewerId: "b" });
  expect(r.content).toContain("**1.** <@a> — 5 pts");
  expect(r.content).toContain("<@b>: #2");
  expect(renderLeaderboard({ range, list: [], page: 1, viewerId: "b" }).content).toContain(
    "No games finished yet",
  );
});

test("stats: average place to one decimal, a dash when none", () => {
  expect(renderStats("a", { games: 3, wins: 1, averagePlace: 2, points: 4 })).toContain(
    "average place: **2.0**",
  );
  expect(renderStats("a", { games: 0, wins: 0, averagePlace: null, points: 0 })).toContain(
    "average place: **—**",
  );
});
