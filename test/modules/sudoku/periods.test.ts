import { expect, test } from "bun:test";
import { FIRST_PUZZLE, periodRange } from "../../../src/modules/sudoku/periods.ts";

test("today is labelled with the puzzle number", () => {
  expect(FIRST_PUZZLE).toBe("2026-11-03");
  expect(periodRange("today", "2026-11-05")).toEqual({
    from: "2026-11-05",
    to: "2026-11-05",
    label: "Sudoku #3",
  });
});

test("week, month and all", () => {
  expect(periodRange("week", "2026-11-05").from).toBe("2026-11-02");
  expect(periodRange("month", "2026-11-05").from).toBe("2026-11-01");
  expect(periodRange("all", "2026-11-05").label).toBe("all time");
});
