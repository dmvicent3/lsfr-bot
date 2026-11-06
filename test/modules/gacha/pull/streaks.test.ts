import { expect, test } from "bun:test";
import type { Landed } from "../../../../src/modules/gacha/engine/types.ts";
import { newFiveRuns } from "../../../../src/modules/gacha/pull/streaks.ts";

const land = (tier: Landed["tier"], o: Partial<Landed> = {}): Landed => ({
  driverId: "d",
  tier,
  featured: false,
  lost: false,
  guaranteed: false,
  pulls: 1,
  level: 0,
  isNew: true,
  refund: 0,
  ...o,
});

test("each new ★5's run counts the history before it", () => {
  const first = land(5, { featured: true });
  const second = land(5, { featured: true });
  const landed = [land(3), first, land(4), second];
  // Two won before, then the two new ones.
  const runs = newFiveRuns([true, true, true, true], landed);

  expect(runs.get(first)).toBe(3);
  expect(runs.get(second)).toBe(4);
});

test("a lost 50/50 starts a losing run; the guaranteed ★5 after it gets none", () => {
  const lost = land(5, { lost: true });
  const guaranteed = land(5, { featured: true, guaranteed: true });
  const runs = newFiveRuns([false, true, false, true], [lost, guaranteed]);

  expect(runs.get(lost)).toBe(2);
  expect(runs.has(guaranteed)).toBe(false);
});
