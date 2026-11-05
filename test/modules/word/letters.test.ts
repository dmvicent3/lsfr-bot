import { expect, test } from "bun:test";
import { letterNotes } from "../../../src/modules/word/letters.ts";

test("no guesses leave every letter untried", () => {
  const n = letterNotes([], "store");
  expect(n.placed).toEqual([]);
  expect(n.near).toEqual([]);
  expect(n.out).toEqual([]);
  expect(n.untried).toHaveLength(26);
  expect(n.pattern).toEqual([null, null, null, null, null]);
});

test("hits, nears and misses sort letters into groups", () => {
  // answer "shore": CRANE -> C miss, R near, A miss, N miss, E hit
  //                 STORE -> S hit, T miss, O hit, R hit, E hit
  const n = letterNotes(["crane", "stove"], "shore");
  expect(n.placed).toEqual([
    { letter: "s", positions: [0] },
    { letter: "o", positions: [2] },
    { letter: "e", positions: [4] },
  ]);
  expect(n.near).toEqual([{ letter: "r", notAt: [1] }]);
  expect(n.out).toEqual(["a", "c", "n", "t", "v"]);
  expect(n.untried).not.toContain("r");
  expect(n.untried).toContain("b");
  expect(n.pattern).toEqual(["s", null, "o", null, "e"]);
});

test("a near letter collects every spot it was tried at", () => {
  // answer "rebus": guess "error" -> e near(0), r near(1), r miss(2), o miss, r miss(4)
  const n = letterNotes(["error"], "rebus");
  expect(n.near).toEqual([
    { letter: "e", notAt: [0] },
    { letter: "r", notAt: [1, 2, 4] },
  ]);
  expect(n.out).toEqual(["o"]);
});

test("a letter later hit leaves the near group", () => {
  const n = letterNotes(["crane", "shore"], "shore");
  expect(n.near).toEqual([]);
  expect(n.placed.map((p) => p.letter)).toEqual(["s", "h", "o", "r", "e"]);
});
