import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { runMigrations } from "./db.ts";

function count(db: Database, sql: string): number {
  return db.query<{ n: number }, []>(sql).get()?.n ?? 0;
}

describe("runMigrations", () => {
  test("applies each migration once", () => {
    const db = new Database(":memory:");
    const migrations = [{ id: "t-001", sql: "CREATE TABLE t (x)" }];
    runMigrations(db, migrations);
    runMigrations(db, migrations);
    expect(count(db, "SELECT count(*) AS n FROM migrations")).toBe(1);
  });

  test("a failing migration leaves no row and no table", () => {
    const db = new Database(":memory:");
    expect(() =>
      runMigrations(db, [{ id: "bad-001", sql: "CREATE TABLE ok (x); CREATE TABLE (" }]),
    ).toThrow();
    expect(count(db, "SELECT count(*) AS n FROM migrations")).toBe(0);
    expect(
      count(db, "SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'ok'"),
    ).toBe(0);
  });
});
