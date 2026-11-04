import { expect, test } from "bun:test";
import { pickDaily } from "../../../../src/modules/sudoku/play/pick.ts";
import { makeGame } from "./game.ts";

test("the day's first open takes the asked level, medium when none", () => {
  expect(pickDaily(null, "hard")).toEqual({ level: "hard", note: null });
  expect(pickDaily(null, null)).toEqual({ level: "medium", note: null });
});

test("later opens reopen the day's pick; asking for another explains why", () => {
  const today = makeGame({ kind: "daily", level: "easy", slot: "easy" });

  expect(pickDaily(today, null)).toEqual({ level: "easy", note: null });
  expect(pickDaily(today, "easy")).toEqual({ level: "easy", note: null });
  expect(pickDaily(today, "hard")).toEqual({
    level: "easy",
    note: "You're on easy today: one daily a day. Every level is in /sudoku practice.",
  });
});
