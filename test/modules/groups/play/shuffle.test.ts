import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { reshuffle } from "../../../../src/modules/groups/play/shuffle.ts";
import { progress } from "./fixtures.ts";

test("shuffle reorders all sixteen words and keeps the rest", () => {
  const p = reshuffle(progress({ picked: "12" }), lcg(4));

  expect(p.order).not.toBe("0123456789abcdef");
  expect(p.order.split("").toSorted().join("")).toBe("0123456789abcdef");
  expect(p.picked).toBe("12");
});
