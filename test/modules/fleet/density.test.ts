import { expect, test } from "bun:test";
import { placementCounts } from "../../../src/modules/fleet/density.ts";
import { sight } from "./sights.ts";

test("an open grid: corners least, the centre most", () => {
  const counts = placementCounts(sight({}));
  expect(counts[0]).toBe(10);
  expect(counts[44]).toBe(34);
});

test("a cell boxed in by misses fits no ship", () => {
  expect(placementCounts(sight({ misses: [1, 10], afloat: [2] }))[0]).toBe(0);
});
