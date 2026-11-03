import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { FinishedGames } from "../../src/core/finished-games.ts";

interface Row {
  guild_id: string;
  date: string;
  user_id: string;
  finished_at: number | null;
}

function setup() {
  const db = new Database(":memory:", { strict: true });
  db.run(
    "CREATE TABLE t_games (guild_id TEXT, date TEXT, user_id TEXT, finished_at INTEGER, PRIMARY KEY (guild_id, date, user_id))",
  );
  const add = (g: string, d: string, u: string, f: number | null) =>
    db.run("INSERT INTO t_games VALUES (?, ?, ?, ?)", [g, d, u, f]);
  add("g", "2026-11-01", "u", 1);
  add("g", "2026-11-02", "u", null);
  add("g", "2026-11-03", "u", 3);
  add("g", "2026-11-03", "v", 3);
  add("h", "2026-11-03", "u", 3);

  return { q: new FinishedGames(db, "t_games", (r: Row) => `${r.user_id}@${r.date}`), add };
}

test("in: finished games of the guild inside the range, inclusive", () => {
  const { q } = setup();
  expect(q.in("g", { label: "x", from: "2026-11-01", to: "2026-11-03" }).toSorted()).toEqual([
    "u@2026-11-01",
    "u@2026-11-03",
    "v@2026-11-03",
  ]);
  expect(q.in("g", { label: "x", from: "2026-11-02", to: "2026-11-02" })).toEqual([]);
});

test("by: one player's finished games in date order", () => {
  const { q } = setup();
  expect(q.by("g", "u")).toEqual(["u@2026-11-01", "u@2026-11-03"]);
});

test("lastBefore: latest finished game strictly before the date, else null", () => {
  const { q } = setup();
  expect(q.lastBefore("g", "u", "2026-11-03")).toBe("u@2026-11-01");
  expect(q.lastBefore("g", "u", "2026-11-01")).toBeNull();
  expect(q.lastBefore("g", "v", "2026-11-04")).toBe("v@2026-11-03");
});
