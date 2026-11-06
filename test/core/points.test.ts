import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { FINISHED, earnedBy, pointsSource, pointsSources } from "../../src/core/points.ts";
import type { BotModule } from "../../src/core/types.ts";

function setup(): Database {
  const db = new Database(":memory:", { strict: true });
  db.run(
    "CREATE TABLE t_games (guild_id TEXT, user_id TEXT, player_id TEXT, points INTEGER, finished_at INTEGER, mode TEXT)",
  );
  const rows: [string, string, number | null, number | null, string][] = [
    ["g", "u", 100, 1, "a"],
    ["g", "u", 50, null, "a"],
    ["g", "u", 30, 2, "b"],
    ["g", "v", 70, 3, "a"],
    ["h", "u", 900, 4, "a"],
  ];

  for (const [g, u, p, f, m] of rows) {
    db.run("INSERT INTO t_games VALUES (?, ?, ?, ?, ?, ?)", [g, u, u, p, f, m]);
  }

  return db;
}

const U = { guildId: "g", userId: "u" };

describe("pointsSource", () => {
  test("sums the player's points in the server, finished rows only", () => {
    const s = pointsSource({ game: "t", label: "T", table: "t_games", where: FINISHED });

    expect(s.earned(setup(), U)).toBe(130);
  });

  test("an extra condition, another player column and expression", () => {
    const db = setup();
    const only = pointsSource({ game: "t", label: "T", table: "t_games", where: "mode = 'a'" });
    const rows = pointsSource({
      game: "t",
      label: "T",
      table: "t_games",
      user: "player_id",
      expr: "1",
    });

    expect(only.earned(db, U)).toBe(150);
    expect(rows.earned(db, U)).toBe(3);
  });

  test("0 for a player with no rows", () => {
    const s = pointsSource({ game: "t", label: "T", table: "t_games" });

    expect(s.earned(setup(), { guildId: "g", userId: "nobody" })).toBe(0);
  });
});

describe("pointsSources and earnedBy", () => {
  test("collects every module's sources in order and reads each", () => {
    const a = pointsSource({ game: "a", label: "A", table: "t_games", where: "mode = 'a'" });
    const b = pointsSource({ game: "b", label: "B", table: "t_games", where: "mode = 'b'" });
    const modules: BotModule[] = [
      { name: "x", points: [a] },
      { name: "y" },
      { name: "z", points: [b] },
    ];
    const sources = pointsSources(modules);

    expect(earnedBy(sources, setup(), U)).toEqual([
      { game: "a", label: "A", points: 150 },
      { game: "b", label: "B", points: 30 },
    ]);
  });
});
