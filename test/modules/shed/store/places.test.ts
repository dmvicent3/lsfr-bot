import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import { shedMigrations } from "../../../../src/modules/shed/store/migrations.ts";
import { ShedRepo } from "../../../../src/modules/shed/store/repo.ts";

function repo(): ShedRepo {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, shedMigrations);
  const r = new ShedRepo(db);
  r.places.add(1, "g", 10, [
    { userId: "a", place: 1, points: 2 },
    { userId: "b", place: 2, points: 1 },
    { userId: "c", place: 3, points: 0 },
  ]);
  r.places.add(2, "g", 20, [
    { userId: "b", place: 1, points: 1 },
    { userId: "a", place: 2, points: 0 },
  ]);
  r.places.add(3, "h", 20, [{ userId: "a", place: 1, points: 5 }]);
  r.places.add(4, "g", 30, [
    { userId: "c", place: 1, points: 1 },
    { userId: "a", place: 3, points: 0 },
  ]);

  return r;
}

test("standings sum points in range, most first, ties by user ID", () => {
  const r = repo();
  expect(r.places.standings("g", 0, 25)).toEqual([
    { userId: "a", points: 2 },
    { userId: "b", points: 2 },
    { userId: "c", points: 0 },
  ]);
  expect(r.places.standings("g", 20, 25)).toEqual([
    { userId: "b", points: 1 },
    { userId: "a", points: 0 },
  ]);
});

test("stats count games, wins, average place and points", () => {
  const r = repo();
  expect(r.places.stats("g", "a")).toEqual({ games: 3, wins: 1, averagePlace: 2, points: 2 });
  expect(r.places.stats("g", "c")).toEqual({ games: 2, wins: 1, averagePlace: 2, points: 1 });
});

test("no rows: zeroes and no average", () => {
  expect(repo().places.stats("g", "zed")).toEqual({
    games: 0,
    wins: 0,
    averagePlace: null,
    points: 0,
  });
});
