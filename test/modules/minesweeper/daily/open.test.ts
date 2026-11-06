import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { freshDaily, openDaily } from "../../../../src/modules/minesweeper/daily/open.ts";
import { scoreDaily } from "../../../../src/modules/minesweeper/daily/finish.ts";
import { applyGiveUp } from "../../../../src/modules/minesweeper/moves.ts";
import { GameStore } from "../../../../src/modules/minesweeper/store/games.ts";
import { minesweeperMigrations } from "../../../../src/modules/minesweeper/store/migrations.ts";
import type { Game } from "../../../../src/modules/minesweeper/types.ts";

const ask = (o: { playerId?: string; date?: string; guildId?: string } = {}) => ({
  guildId: "g",
  channelId: "c",
  playerId: "u",
  date: "2026-11-06",
  level: "expert" as const,
  controls: "menus" as const,
  now: 5,
  ...o,
});

let store: GameStore;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, minesweeperMigrations);
  store = new GameStore(db);
});

test("every player of a server gets the same map; another day or server differs", () => {
  const a = freshDaily(ask());
  expect(freshDaily(ask({ playerId: "v" })).field).toEqual(a.field);
  expect(freshDaily(ask({ date: "2026-11-07" })).field).not.toEqual(a.field);
  expect(freshDaily(ask({ guildId: "h" })).field).not.toEqual(a.field);
});

test("a fresh daily starts opened, unstarted, with its 3BV", () => {
  const g = freshDaily(ask());
  expect(g).toMatchObject({ kind: "daily", level: "expert", date: "2026-11-06", startedAt: null });
  expect(g.cells.filter((c) => c === "open").length).toBeGreaterThanOrEqual(9);
  expect(g.cells[g.cursor]).toBe("open");
  expect(g.bbbv).toBeGreaterThan(0);
});

test("opening again returns the same game", () => {
  const first = openDaily(store, ask());
  expect(openDaily(store, ask()).id).toBe(first.id);
});

const finished = (o: Partial<Game>): Game => ({
  ...openDaily(store, ask({ date: o.date ?? "2026-11-06" })),
  finishedAt: 9,
  ...o,
});

test("a win after yesterday's win extends the streak and scores", () => {
  const y = finished({ date: "2026-11-05", result: "won" });
  store.save(scoreDaily(store, y).game);
  const t = finished({ result: "won" });
  const { game, award } = scoreDaily(store, { ...t, clicks: (t.bbbv ?? 0) + 10 });
  expect(game.streak).toBe(2);
  expect(award?.parts).toContain("10 extra clicks: −10");
  expect(game.points).toBe(150 - 10 + 5);
});

test("a loss or give-up scores 0 and ends the streak", () => {
  const { game, award } = scoreDaily(store, applyGiveUp(openDaily(store, ask()), 9));
  expect(award).toBeNull();
  expect(game).toMatchObject({ points: 0, streak: 0, result: "gave-up" });
});
