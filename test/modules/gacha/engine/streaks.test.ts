import { describe, expect, test } from "bun:test";
import { coinsOf, fiftyFifty } from "../../../../src/modules/gacha/engine/streaks.ts";

describe("coinsOf", () => {
  test("the ★5 after a lost 50/50 was guaranteed and rolled none", () => {
    expect(coinsOf([true, false, true, true, false, true])).toEqual(["won", "lost", "won", "lost"]);
  });

  test("no ★5s, no 50/50s", () => {
    expect(coinsOf([])).toEqual([]);
  });
});

describe("fiftyFifty", () => {
  test("current run, best runs and totals", () => {
    expect(fiftyFifty(["won", "won", "lost", "lost", "won", "won", "won"])).toEqual({
      current: { coin: "won", run: 3 },
      best: { won: 3, lost: 2 },
      count: { won: 5, lost: 2 },
    });
  });

  test("nothing rolled yet", () => {
    expect(fiftyFifty([])).toEqual({
      current: null,
      best: { won: 0, lost: 0 },
      count: { won: 0, lost: 0 },
    });
  });
});
