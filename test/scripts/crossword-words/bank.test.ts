import { describe, expect, test } from "bun:test";
import { buildBank } from "../../../scripts/crossword-words/bank.ts";

const defs = new Map([
  ["cat", "a domestic cat"],
  ["dog", "canine pet"],
  ["bat", "nocturnal flying mammal"],
  ["ox", "bovine"],
  ["fly", "to"],
  ["ant", "small insect"],
  ["crap", "rubbish talk"],
  ["nope", "no entry here is fine"],
]);

describe("buildBank", () => {
  const enable = new Set(["cat", "dog", "bat", "fly", "ant", "crap", "ox", "ghost", "nope"]);
  const frequent = ["the", "dog", "cat", "crap", "bat", "fly", "ant", "ghost", "ox", "nope"];
  const bank = buildBank({
    enable,
    frequent,
    blocked: new Set(["crap"]),
    definitions: defs,
    common: 30_000,
  });

  test("drops leaking, short-gloss, blocked, no-entry, out-of-range words", () => {
    expect(bank.map((b) => b.word)).toEqual(["ant", "bat", "dog", "nope"]);
  });
  test("sorted by word with rank = frequency index", () => {
    expect(bank).toEqual([
      { word: "ant", def: "small insect", rank: 6 },
      { word: "bat", def: "nocturnal flying mammal", rank: 4 },
      { word: "dog", def: "canine pet", rank: 1 },
      { word: "nope", def: "no entry here is fine", rank: 9 },
    ]);
  });
  test("common cutoff limits the frequency list", () => {
    const small = buildBank({
      enable,
      frequent,
      blocked: new Set(),
      definitions: defs,
      common: 3,
    });

    expect(small.map((b) => b.word)).toEqual(["dog"]);
  });
});
