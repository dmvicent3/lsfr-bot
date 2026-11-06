import { expect, test } from "bun:test";
import { pickDaily } from "../../../../src/modules/minesweeper/daily/pick.ts";
import { game } from "../fixtures.ts";

const today = game(["*.."], { kind: "daily", date: "2026-11-06", level: "expert" });

test("the first open takes the asked level, else intermediate", () => {
  expect(pickDaily(null, "beginner")).toEqual({ level: "beginner", note: null });
  expect(pickDaily(null, null)).toEqual({ level: "intermediate", note: null });
});

test("later opens keep the day's level; asking for another one says so", () => {
  expect(pickDaily(today, null)).toEqual({ level: "expert", note: null });
  expect(pickDaily(today, "expert").note).toBeNull();
  expect(pickDaily(today, "beginner")).toEqual({
    level: "expert",
    note: "You're on expert today: one daily a day. Any size is in /minesweeper play.",
  });
});
