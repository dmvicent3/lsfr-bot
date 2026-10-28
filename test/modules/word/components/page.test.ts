import { expect, test } from "bun:test";
import { pageArgs } from "../../../../src/modules/word/components/page.ts";

test("page args are read back", () => {
  expect(pageArgs(["week", "2"])).toEqual({ period: "week", page: 2 });
});

test("unknown args fall back", () => {
  expect(pageArgs(["year", "x"])).toEqual({ period: "today", page: 1 });
  expect(pageArgs([])).toEqual({ period: "today", page: 1 });
});
