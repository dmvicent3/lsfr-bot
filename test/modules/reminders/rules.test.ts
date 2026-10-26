import { describe, expect, test } from "bun:test";
import { canAct, checkNew, lateBy, refusedTarget } from "../../../src/modules/reminders/rules.ts";
import { reminder } from "./fixtures.ts";

const MIN = 60_000;
const YEAR = 365 * 24 * 60 * MIN;
const ok = { at: MIN, now: 0, text: "x", pending: 0 };

describe("checkNew", () => {
  test("due from 1 minute to 1 year ahead", () => {
    expect(checkNew({ ...ok, at: 59_000 })).toBeString();
    expect(checkNew({ ...ok, at: MIN })).toBeNull();
    expect(checkNew({ ...ok, at: YEAR })).toBeNull();
    expect(checkNew({ ...ok, at: YEAR + MIN })).toBeString();
  });

  test("text of 1 to 500 characters", () => {
    expect(checkNew({ ...ok, text: "" })).toBeString();
    expect(checkNew({ ...ok, text: "a".repeat(500) })).toBeNull();
    expect(checkNew({ ...ok, text: "a".repeat(501) })).toBeString();
  });

  test("at most 25 pending per author", () => {
    expect(checkNew({ ...ok, pending: 24 })).toBeNull();
    expect(checkNew({ ...ok, pending: 25 })).toBeString();
  });
});

describe("refusedTarget", () => {
  test("only the @everyone role (id = server id) is refused", () => {
    expect(refusedTarget({ kind: "role", id: "g1" }, "g1")).toBe(true);
    expect(refusedTarget({ kind: "role", id: "r1" }, "g1")).toBe(false);
    expect(refusedTarget({ kind: "user", id: "u1" }, "g1")).toBe(false);
  });
});

describe("canAct", () => {
  const forRole = reminder({ target: { kind: "role", id: "r1" } });

  test("the author, the target user and members of the target role", () => {
    expect(canAct(reminder(), { id: "u1", roleIds: [] })).toBe(true);
    expect(canAct(reminder(), { id: "u2", roleIds: [] })).toBe(true);
    expect(canAct(forRole, { id: "u3", roleIds: ["r1"] })).toBe(true);
  });

  test("anyone else may not", () => {
    expect(canAct(reminder(), { id: "u3", roleIds: ["u2"] })).toBe(false);
    expect(canAct(forRole, { id: "u3", roleIds: ["r2"] })).toBe(false);
  });
});

describe("lateBy", () => {
  test("only counts past 2 minutes", () => {
    expect(lateBy(0, 120_000)).toBeNull();
    expect(lateBy(0, 180_000)).toBe(180_000);
  });
});
