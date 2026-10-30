import { expect, test } from "bun:test";
import { periodRange } from "../../../src/modules/word/periods.ts";

test("today", () => {
  expect(periodRange("today", "2026-10-30")).toEqual({
    from: "2026-10-30",
    to: "2026-10-30",
    label: "Word #3",
  });
});
