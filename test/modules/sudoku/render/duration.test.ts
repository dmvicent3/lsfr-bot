import { expect, test } from "bun:test";
import { formatDuration } from "../../../../src/modules/sudoku/render/duration.ts";

test("formats seconds, minutes and hours", () => {
  expect(formatDuration(45_900)).toBe("45s");
  expect(formatDuration(0)).toBe("0s");
  expect(formatDuration(59_999)).toBe("59s");
  expect(formatDuration(60_000)).toBe("1m 0s");
  expect(formatDuration(23 * 60_000 + 10_000)).toBe("23m 10s");
  expect(formatDuration(3_600_000 + 4 * 60_000 + 59_000)).toBe("1h 4m");
});
