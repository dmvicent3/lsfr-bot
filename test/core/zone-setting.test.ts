import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../src/core/db.ts";
import { coreMigrations, getSetting, setSetting } from "../../src/core/settings.ts";
import { sum } from "../../src/core/sum.ts";
import { DEFAULT_TIME_ZONE, zoneSetting } from "../../src/core/zone-setting.ts";

const fresh = (): Database => {
  const db = new Database(":memory:");
  runMigrations(db, coreMigrations);

  return db;
};

test("defaults to Lisbon when unset", () => {
  expect(zoneSetting("x").get(fresh(), "g")).toBe(DEFAULT_TIME_ZONE);
  expect(DEFAULT_TIME_ZONE).toBe("Europe/Lisbon");
});

test("save stores under <prefix>.timezone.<guild> and get reads it back", () => {
  const db = fresh();
  const zone = zoneSetting("x");
  expect(zone.save(db, "g", "Asia/Tokyo")).toBeNull();
  expect(getSetting(db, "x.timezone.g")).toBe("Asia/Tokyo");
  expect(zone.get(db, "g")).toBe("Asia/Tokyo");
  expect(zone.get(db, "other")).toBe(DEFAULT_TIME_ZONE);
});

test("an unknown zone is refused and not saved", () => {
  const db = fresh();
  const zone = zoneSetting("x");
  expect(zone.save(db, "g", "Mars/Base")).toBe("Unknown time zone: Mars/Base.");
  expect(getSetting(db, "x.timezone.g")).toBeNull();
});

test("a stored zone that is no longer valid falls back to the default", () => {
  const db = fresh();
  setSetting(db, "x.timezone.g", "Mars/Base");
  expect(zoneSetting("x").get(db, "g")).toBe(DEFAULT_TIME_ZONE);
});

test("sum totals numbers and is 0 when empty", () => {
  expect(sum([1, 2, 3.5])).toBe(6.5);
  expect(sum([])).toBe(0);
});
