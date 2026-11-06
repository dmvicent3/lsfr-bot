import { expect, test } from "bun:test";
import { dailyStats } from "../../../../src/modules/minesweeper/daily/stats.ts";
import { standings } from "../../../../src/modules/minesweeper/daily/ranking.ts";
import {
  announceText,
  dailyStatsLine,
  dailyTitle,
} from "../../../../src/modules/minesweeper/render/result.ts";
import type { Game } from "../../../../src/modules/minesweeper/types.ts";
import { game } from "../fixtures.ts";

const daily = (o: Partial<Game>): Game =>
  game(["*.."], {
    kind: "daily",
    date: "2026-11-08",
    level: "expert",
    bbbv: 118,
    startedAt: 0,
    finishedAt: 252_000,
    ...o,
  });

test("the daily's title names its number and level", () => {
  expect(dailyTitle(daily({}))).toBe("Minesweeper #3 · Expert");
});

test("the public line for a win, a loss and a give-up", () => {
  expect(announceText(daily({ result: "won", clicks: 132, points: 136 }))).toBe(
    "💣 <@u> · Minesweeper #3 · Expert · ✅ 132 clicks (3BV 118) · 4:12 · +136 pts",
  );
  expect(announceText(daily({ result: "lost", clicks: 40 }))).toBe(
    "💣 <@u> · Minesweeper #3 · Expert · ❌ hit a mine after 40 clicks",
  );
  expect(announceText(daily({ result: "gave-up", clicks: 1 }))).toBe(
    "💣 <@u> · Minesweeper #3 · Expert · ❌ gave up after 1 click",
  );
});

test("standings: points, then wins", () => {
  const list = standings([
    daily({ playerId: "a", result: "won", points: 100, finishedAt: 5 }),
    daily({ playerId: "b", result: "won", points: 140, finishedAt: 6 }),
    daily({ playerId: "a", result: "won", points: 60, finishedAt: 7 }),
    daily({ playerId: "c", result: "lost", points: 0, finishedAt: 8 }),
  ]);
  expect(list.map((s) => [s.userId, s.points, s.wins])).toEqual([
    ["a", 160, 2],
    ["b", 140, 1],
    ["c", 0, 0],
  ]);
});

test("daily stats: record, current and best streak, best efficiency", () => {
  const s = dailyStats(
    [
      daily({ date: "2026-11-05", result: "won", streak: 1, points: 150, clicks: 118 }),
      daily({ date: "2026-11-06", result: "won", streak: 2, points: 100, clicks: 236 }),
      daily({ date: "2026-11-07", result: "lost", streak: 0, points: 0, clicks: 5 }),
    ],
    "2026-11-08",
  );
  expect(s).toEqual({
    played: 3,
    won: 2,
    streak: 0,
    bestStreak: 2,
    points: 250,
    bestEfficiency: 100,
  });
  expect(dailyStatsLine(s)).toBe(
    "Daily: 2/3 won · 250 pts · streak 0 (best 2) · best efficiency 100%",
  );
  expect(dailyStats([], "2026-11-08")).toBeNull();
});
