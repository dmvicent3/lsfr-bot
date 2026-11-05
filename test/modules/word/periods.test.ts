import { expect, test } from "bun:test";
import { TRACKS } from "../../../src/modules/word/tracks.ts";
import { periodRange } from "../../../src/modules/word/periods.ts";

test("today", () => {
  expect(periodRange("today", "2026-10-30", TRACKS.classic)).toEqual({
    from: "2026-10-30",
    to: "2026-10-30",
    label: "Word #3",
  });
});

test("a Duo day is named and numbered after Duo", () => {
  expect(periodRange("today", "2026-11-06", TRACKS.duo).label).toBe("Word Duo #2");
});
