import { describe, expect, test } from "bun:test";
import { glossOf } from "../../../scripts/crossword-words/gloss.ts";
import {
  parseDataLine,
  parseIndexLine,
  pickEntry,
  readDefinitions,
} from "../../../scripts/crossword-words/wndb.ts";

const FIXTURES = new URL("fixtures/", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");

describe("glossOf", () => {
  test("cuts at the first semicolon", () => expect(glossOf("a bat; more")).toBe("a bat"));
  test("cuts at the first quote", () => expect(glossOf('fly; "x"')).toBe("fly"));
  test("cuts at a quote before a semicolon", () => {
    expect(glossOf('travel "x"; y')).toBe("travel");
  });
  test("trims", () => expect(glossOf("  spaced out  ")).toBe("spaced out"));
});

describe("parseIndexLine", () => {
  test("reads sense count and first synset", () => {
    expect(parseIndexLine("cat n 2 2 @ ~ 2 1 00000010 00000020  ")).toEqual({
      lemma: "cat",
      pos: "n",
      senses: 2,
      first: "00000010",
    });
  });
  test("skips the licence header", () => expect(parseIndexLine("  1 License")).toBeNull());
});

describe("parseDataLine", () => {
  test("reads offset and gloss", () => {
    expect(parseDataLine('00000030 05 n 01 bat 0 000 | nocturnal mammal; "a bat"  ')).toEqual({
      offset: "00000030",
      gloss: "nocturnal mammal",
    });
  });
  test("skips the licence header", () => expect(parseDataLine("  1 License")).toBeNull());
});

const e = (pos: "n" | "v" | "a" | "r", senses: number) => ({ lemma: "x", pos, senses, first: pos });

describe("pickEntry", () => {
  test("most senses wins", () => expect(pickEntry(e("n", 1), e("v", 3)).pos).toBe("v"));
  test("ties go noun, verb, adj, adv", () => {
    expect(pickEntry(e("r", 2), e("a", 2), e("v", 2), e("n", 2)).pos).toBe("n");
    expect(pickEntry(e("r", 2), e("a", 2), e("v", 2)).pos).toBe("v");
    expect(pickEntry(e("r", 2), e("a", 2)).pos).toBe("a");
  });
});

describe("readDefinitions", () => {
  const defs = readDefinitions(FIXTURES);

  test("first sense of the richest part of speech", () => {
    expect(defs.get("fly")).toBe("travel through the air");
    expect(defs.get("plain")).toBe("free of ornamentation");
  });
  test("noun wins a tie", () => expect(defs.get("shed")).toBe("a small hut"));
  test("satellite adjectives are included", () => {
    expect(defs.get("bad")).toBe("x");
  });
  test("multi-word lemmas are skipped", () => expect(defs.has("ice_cream")).toBe(false));
  test("adverbs are included", () => expect(defs.get("fast")).toBe("quickly"));
});
