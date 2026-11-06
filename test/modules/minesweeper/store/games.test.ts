import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { GameStore } from "../../../../src/modules/minesweeper/store/games.ts";
import { minesweeperMigrations } from "../../../../src/modules/minesweeper/store/migrations.ts";
import type { Game, NewGame } from "../../../../src/modules/minesweeper/types.ts";
import { game } from "../fixtures.ts";

const live = (opts: Partial<Game> = {}): NewGame => {
  const { id: _id, ...rest } = game(["*f.", "o..", "..."], { cursor: 4, ...opts });

  return rest;
};

let store: GameStore;

beforeEach(() => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, minesweeperMigrations);
  store = new GameStore(db);
});

describe("GameStore", () => {
  test("a game round-trips by its message", () => {
    const saved = store.insert(live());
    expect(store.byMessage("m")).toEqual(saved);
    expect(saved).toEqual({ ...live(), id: saved.id });
  });

  test("a game before its first reveal round-trips with no field", () => {
    const saved = store.insert(live({ field: null, startedAt: null }));
    expect(store.byMessage("m")).toMatchObject({ id: saved.id, field: null, startedAt: null });
  });

  test("a game keeps its controls", () => {
    store.insert(live({ controls: "both" }));
    expect(store.byMessage("m")?.controls).toBe("both");
  });

  test("an unknown message has no game", () => {
    expect(store.byMessage("nope")).toBeNull();
  });

  test("the live game ignores finished ones", () => {
    const old = store.insert(live({ messageId: "old" }));
    store.save({ ...old, result: "lost", hit: 0, finishedAt: 5_000 });
    const current = store.insert(live({ messageId: "new" }));
    expect(store.live("g", "u")?.id).toBe(current.id);
    expect(store.live("g", "other")).toBeNull();
  });

  test("a finish saves once; a second save of the same game changes nothing", () => {
    const g = store.insert(live());
    expect(store.save({ ...g, result: "won", finishedAt: 5_000 })).toBe(true);
    expect(store.save({ ...g, result: "lost", hit: 0, finishedAt: 6_000 })).toBe(false);
    expect(store.byMessage("m")).toMatchObject({ result: "won", finishedAt: 5_000, hit: null });
  });

  test("a live save writes the moved cursor and cells", () => {
    const g = store.insert(live());
    expect(store.save({ ...g, cursor: 8, cells: g.cells.map(() => "open") })).toBe(true);
    expect(store.byMessage("m")).toMatchObject({ cursor: 8 });
    expect(store.byMessage("m")?.cells.every((c) => c === "open")).toBe(true);
  });

  test("a removed game is gone", () => {
    const g = store.insert(live());
    store.remove(g.id);
    expect(store.byMessage("m")).toBeNull();
  });

  test("finished games of a player, oldest first, started ones only", () => {
    const a = store.insert(live({ messageId: "a" }));
    const b = store.insert(live({ messageId: "b" }));
    const never = store.insert(live({ messageId: "c", startedAt: null }));
    store.save({ ...b, result: "won", finishedAt: 3_000 });
    store.save({ ...a, result: "lost", finishedAt: 4_000 });
    store.save({ ...never, result: "gave-up", finishedAt: 5_000 });
    expect(store.finished("g", "u")).toEqual([
      { width: 3, height: 3, mines: 1, result: "won", startedAt: 1_000, finishedAt: 3_000 },
      { width: 3, height: 3, mines: 1, result: "lost", startedAt: 1_000, finishedAt: 4_000 },
    ]);
  });
});

describe("daily rows", () => {
  const daily = (opts: Partial<Game> = {}): NewGame =>
    live({ kind: "daily", date: "2026-11-07", level: "expert", bbbv: 30, ...opts });

  test("a daily round-trips with its daily fields", () => {
    const saved = store.insert(daily({ clicks: 4 }));
    expect(store.dailyOn("g", "u", "2026-11-07")).toEqual(saved);
    expect(store.dailyOn("g", "u", "2026-11-08")).toBeNull();
  });

  test("practice live and finished never see dailies", () => {
    const d = store.insert(daily());
    expect(store.live("g", "u")).toBeNull();
    store.save({ ...d, result: "won", finishedAt: 3_000, points: 150, streak: 1 });
    expect(store.finished("g", "u")).toEqual([]);
  });

  test("a save writes clicks, points and streak", () => {
    const d = store.insert(daily());
    store.save({ ...d, clicks: 9, result: "won", finishedAt: 3_000, points: 140, streak: 2 });
    expect(store.dailyOn("g", "u", "2026-11-07")).toMatchObject({ clicks: 9, points: 140, streak: 2 });
  });

  test("the last finished daily before a date", () => {
    const a = store.insert(daily({ date: "2026-11-05", messageId: "a" }));
    const b = store.insert(daily({ date: "2026-11-06", messageId: "b" }));
    store.insert(daily({ date: "2026-11-07", messageId: "c" }));
    store.save({ ...a, result: "won", finishedAt: 1, streak: 1, points: 1 });
    expect(store.lastDailyBefore("g", "u", "2026-11-07")?.id).toBe(a.id);
    store.save({ ...b, result: "lost", finishedAt: 2, streak: 0, points: 0 });
    expect(store.lastDailyBefore("g", "u", "2026-11-07")?.id).toBe(b.id);
  });

  test("finished dailies in a date range, and a player's own", () => {
    const a = store.insert(daily({ date: "2026-11-05", messageId: "a" }));
    store.insert(daily({ date: "2026-11-06", messageId: "b" }));
    store.save({ ...a, result: "won", finishedAt: 1, streak: 1, points: 50 });
    expect(store.dailiesIn("g", { from: "2026-11-01", to: "2026-11-30", label: "" }).map((g) => g.id)).toEqual([a.id]);
    expect(store.dailiesIn("g", { from: "2026-11-06", to: "2026-11-30", label: "" })).toEqual([]);
    expect(store.dailyFinished("g", "u").map((g) => g.id)).toEqual([a.id]);
  });

  test("setMessage points a reopened daily at its new message", () => {
    const d = store.insert(daily());
    store.setMessage(d.id, "new");
    expect(store.byMessage("new")?.id).toBe(d.id);
  });
});

describe("minesweeper-002-controls", () => {
  test("games stored before it keep the menus", () => {
    const db = new Database(":memory:", { strict: true });
    runMigrations(db, minesweeperMigrations.slice(0, 1));
    db.run(
      `INSERT INTO minesweeper_games (guild_id, channel_id, message_id, player_id, width, height,
         mines, cells, cursor, created_at) VALUES ('g', 'c', 'old', 'u', 5, 5, 3, ?, 12, 0)`,
      ["h".repeat(25)],
    );
    runMigrations(db, minesweeperMigrations);
    expect(new GameStore(db).byMessage("old")?.controls).toBe("menus");
  });
});
