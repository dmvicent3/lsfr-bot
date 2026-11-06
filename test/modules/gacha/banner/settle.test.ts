import { describe, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { eligible, sample } from "../../../../src/modules/gacha/banner/eligible.ts";
import {
  pollOptions,
  settleBanner,
  topVoted,
} from "../../../../src/modules/gacha/banner/settle.ts";
import type { Featured, Pools } from "../../../../src/modules/gacha/engine/types.ts";

const FIVES = ["a", "b", "c", "d", "e", "f"];
const FOURS = Array.from({ length: 20 }, (_, n) => `q${n}`);
const POOLS: Pools = { 5: FIVES, 4: FOURS, 3: ["t"] };
/** Seeds far apart: an LCG's first draws barely differ for neighbouring seeds. */
const spread = (s: number): (() => number) => lcg(Math.imul(s + 1, 2_654_435_761));
const RECENT: Featured[] = [
  { five: "a", fours: ["q0", "q1", "q2"] },
  { five: "b", fours: ["q3", "q4", "q5"] },
];

describe("eligible", () => {
  test("leaves out everyone featured on the recent banners", () => {
    expect(eligible(FIVES, RECENT, 1)).toEqual(["c", "d", "e", "f"]);
  });

  test("falls back to the whole pool when too few are left", () => {
    expect(eligible(["a", "b"], RECENT, 1)).toEqual(["a", "b"]);
  });
});

describe("sample", () => {
  test("n different items", () => {
    const got = sample(FOURS, 8, lcg(3));

    expect(new Set(got).size).toBe(8);
  });
});

describe("topVoted", () => {
  test("most votes first", () => {
    const tally = { options: ["a", "b", "c", "d"], votes: [1, 5, 3, 0] };

    expect(topVoted(tally, 1, lcg(1))).toEqual(["b"]);
    expect(topVoted(tally, 2, lcg(1))).toEqual(["b", "c"]);
  });

  test("ties and empty polls are settled at random", () => {
    const tally = { options: ["a", "b", "c", "d"], votes: [2, 2, 0, 0] };
    const firsts = new Set(Array.from({ length: 40 }, (_, s) => topVoted(tally, 1, spread(s))[0]));

    expect(firsts).toEqual(new Set(["a", "b"]));

    const none = { options: ["a", "b", "c", "d"], votes: [0, 0, 0, 0] };
    const picks = new Set(Array.from({ length: 60 }, (_, s) => topVoted(none, 1, spread(s))[0]));

    expect(picks.size).toBe(4);
  });
});

describe("settleBanner", () => {
  test("takes the polls' winners: one ★5 and the top three ★4s", () => {
    const polls = {
      five: { options: ["c", "d", "e", "f"], votes: [0, 4, 1, 0] },
      fours: {
        options: ["q6", "q7", "q8", "q9", "q10", "q11", "q12", "q13"],
        votes: [5, 4, 3, 2, 1, 0, 0, 0],
      },
    };

    expect(settleBanner({ polls, pools: POOLS, recent: RECENT }, lcg(9))).toEqual({
      five: "d",
      fours: ["q6", "q7", "q8"],
    });
  });

  test("without polls picks at random from the eligible drivers", () => {
    for (let s = 1; s <= 30; s++) {
      const f = settleBanner(
        { polls: { five: null, fours: null }, pools: POOLS, recent: RECENT },
        lcg(s),
      );

      expect(["a", "b"]).not.toContain(f.five);
      expect(f.fours).toHaveLength(3);
      expect(new Set(f.fours).size).toBe(3);
      expect(f.fours.some((id) => ["q0", "q1", "q2", "q3", "q4", "q5"].includes(id))).toBe(false);
    }
  });
});

describe("pollOptions", () => {
  test("4 eligible ★5s and 8 eligible ★4s", () => {
    const o = pollOptions({ pools: POOLS, recent: RECENT }, lcg(5));

    expect(o.five).toHaveLength(4);
    expect(o.five.some((id) => id === "a" || id === "b")).toBe(false);
    expect(new Set(o.fours).size).toBe(8);
  });
});
