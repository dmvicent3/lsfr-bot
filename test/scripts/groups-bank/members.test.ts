import { describe, expect, test } from "bun:test";
import { below, idOf, membersOf, synsetOf } from "../../../scripts/groups-bank/members.ts";
import { lexicon, net } from "./fixtures.ts";

describe("synsetOf", () => {
  test("finds the N-th noun sense", () => expect(synsetOf(net(), "bass.n.2")?.offset).toBe("05"));
  test("null for a missing sense", () => expect(synsetOf(net(), "bass.n.3")).toBeNull());
  test("null for a bad id", () => expect(synsetOf(net(), "bass")).toBeNull());
});

describe("idOf", () => {
  test("names a synset by its first lemma", () => {
    const n = net();

    expect(idOf(n, n.synsets.get("05")!)).toBe("bass.n.2");
  });
});

describe("below", () => {
  test("walks hyponyms transitively", () => {
    const n = net();
    const offsets = below(n, n.synsets.get("01")!).map((s) => s.offset);

    expect(offsets.toSorted()).toEqual(["02", "03", "04", "05", "06", "07"]);
  });
});

const fish = (blocked: string[] = []) => {
  const n = net();

  return membersOf(n, n.synsets.get("01")!, lexicon(blocked));
};

describe("membersOf", () => {
  test("lists common single words by rank, skipping slurs and the root's own lemma", () => {
    expect(fish().map((m) => m.word)).toEqual(["bass", "trout", "salmon", "pike", "sockeye"]);
  });
  test("records the category's sense of the word", () => {
    expect(fish().find((m) => m.word === "bass")).toEqual({ word: "bass", rank: 10, sense: 2 });
  });
  test("skips blocked words", () =>
    expect(fish(["trout"]).map((m) => m.word)).not.toContain("trout"));
});
