import { expect, test } from "bun:test";
import { parseKey } from "../../../../src/modules/sudoku/components/key.ts";

test("a daily key takes its date and level from the ID", () => {
  expect(parseKey(["daily", "2026-11-02", "hard"], "u", "g")).toEqual({
    guildId: "g",
    userId: "u",
    kind: "daily",
    date: "2026-11-02",
    slot: "hard",
  });
});

test("a practice key has no date or slot", () => {
  expect(parseKey(["practice"], "u", "g")).toEqual({
    guildId: "g",
    userId: "u",
    kind: "practice",
    date: "",
    slot: "",
  });
});

test("junk is no key", () => {
  expect(parseKey([], "u", "g")).toBeNull();
  expect(parseKey(["daily", "2026-11-02"], "u", "g")).toBeNull();
  expect(parseKey(["daily", "tomorrow", "easy"], "u", "g")).toBeNull();
  expect(parseKey(["daily", "2026-11-02", "insane"], "u", "g")).toBeNull();
  expect(parseKey(["daily", "2026-11-02", "easy", "x"], "u", "g")).toBeNull();
  expect(parseKey(["practice", "x"], "u", "g")).toBeNull();
  expect(parseKey(["weekly"], "u", "g")).toBeNull();
});
