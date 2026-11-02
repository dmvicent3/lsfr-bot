import { expect, test } from "bun:test";
import { FIRST_PUZZLE, periodRange } from "../../../src/modules/grid/periods.ts";

test("periods are labelled with the puzzle number", () => {
  expect(FIRST_PUZZLE).toBe("2026-11-03");
  expect(periodRange("today", "2026-11-05")).toEqual({
    from: "2026-11-05",
    to: "2026-11-05",
    label: "Country grid #3",
  });
  expect(periodRange("week", "2026-11-05").from).toBe("2026-11-02");
});
