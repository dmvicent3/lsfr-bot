import { describe, expect, test } from "bun:test";
import { parseAllowlist, parsePick } from "../../../scripts/groups-bank/allowlist.ts";
import { buildBank } from "../../../scripts/groups-bank/bank.ts";
import { parseSynset } from "../../../scripts/groups-bank/wndb.ts";
import { lexicon, net } from "./fixtures.ts";

describe("parseSynset", () => {
  test("reads lemmas, hyponym pointers and gloss", () => {
    const line =
      '00000010 05 n 02 fish 0 Fish 1 003 @ 00000001 n 0000 ~ 00000020 n 0000 ~i 00000030 n 0000 | a cold animal; "x"  ';

    expect(parseSynset(line)).toEqual({
      offset: "00000010",
      words: ["fish", "Fish"],
      hyponyms: ["00000020", "00000030"],
      gloss: "a cold animal",
    });
  });
  test("reads a hex word count", () => {
    const words = Array.from({ length: 10 }, (_, k) => `w${k} 0`).join(" ");

    expect(parseSynset(`00000010 05 n 0a ${words} 000 | g`)?.words).toHaveLength(10);
  });
  test("skips licence lines", () => expect(parseSynset("  1 This software")).toBeNull());
});

describe("parsePick", () => {
  test("reads id, name, drops, adds and level", () => {
    expect(parsePick("fish.n.1 | Fish | molly ling +bass !3")).toEqual({
      id: "fish.n.1",
      name: "Fish",
      drop: ["molly", "ling"],
      add: ["bass"],
      level: 3,
    });
  });
  test("a bare line has no extras", () =>
    expect(parsePick("fish.n.1 | Fish")).toEqual({ id: "fish.n.1", name: "Fish" }));
  test("skips comments and blanks", () => {
    expect(parsePick("# Animals")).toBeNull();
    expect(parsePick("  ")).toBeNull();
  });
  test("rejects a bad id", () =>
    expect(() => parsePick("fish | Fish")).toThrow("bad allowlist line"));
});

describe("parseAllowlist", () => {
  test("reads every pick", () => {
    expect(
      parseAllowlist("# x\r\nfish.n.1 | Fish\n\nbird.n.1 | Birds\n").map((p) => p.name),
    ).toEqual(["Fish", "Birds"]);
  });
});

describe("buildBank", () => {
  // A lone category sits in every quartile cut, so it lands on the top level.
  test("builds categories and says why others were skipped", () => {
    const { bank, skipped } = buildBank(net(), lexicon(), [
      { id: "fish.n.1", name: "Fish", add: ["sockeye"] },
      { id: "fish.n.1", name: "Typo", drop: ["trot"] },
      { id: "salmon.n.1", name: "Salmon" },
      { id: "nope.n.1", name: "Nope" },
    ]);

    expect(bank).toEqual([
      { name: "Fish", level: 3, words: ["bass", "trout", "salmon", "pike", "sockeye"], also: [] },
    ]);
    expect(skipped).toEqual([
      { id: "fish.n.1", why: "not members: trot" },
      { id: "salmon.n.1", why: "too few words" },
      { id: "nope.n.1", why: "no such synset" },
    ]);
  });
});
