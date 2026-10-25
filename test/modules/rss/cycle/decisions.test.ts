import { describe, expect, test } from "bun:test";
import { expiryCutoff, feedResult, notice } from "../../../../src/modules/rss/cycle/decisions.ts";

describe("expiryCutoff", () => {
  test("is 24 hours before now", () => {
    expect(expiryCutoff(100 * 3_600_000)).toBe(76 * 3_600_000);
  });
});

describe("notice", () => {
  test("says down once and back once", () => {
    expect(notice(false, "failed")).toBe("down");
    expect(notice(true, "failed")).toBeNull();
    expect(notice(true, "ok")).toBe("back");
    expect(notice(false, "ok")).toBeNull();
    expect(notice(false, "unused")).toBeNull();
    expect(notice(true, "unused")).toBeNull();
  });
});

describe("feedResult", () => {
  test("warns on the 10th failure in a row only", () => {
    expect(feedResult({ failures: 8, warned: false }, false)).toEqual({
      failures: 9,
      warned: false,
      warn: false,
    });
    expect(feedResult({ failures: 9, warned: false }, false)).toEqual({
      failures: 10,
      warned: true,
      warn: true,
    });
    expect(feedResult({ failures: 10, warned: true }, false)).toEqual({
      failures: 11,
      warned: true,
      warn: false,
    });
  });

  test("a success resets the count and the warning", () => {
    expect(feedResult({ failures: 12, warned: true }, true)).toEqual({
      failures: 0,
      warned: false,
      warn: false,
    });
  });
});
