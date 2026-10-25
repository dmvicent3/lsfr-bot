import { describe, expect, test } from "bun:test";
import { JevError } from "../../../core/jev/http.ts";
import {
  articleState,
  buildQuestions,
  describeRule,
  question,
  rulesFor,
  verdict,
} from "./rules.ts";
import type { Rule } from "./types.ts";

const answers = (...pairs: [string, number][]) => new Map<string, number>(pairs);

const block = (id: number, text: string, feedIds: number[] = []): Rule => ({
  id,
  text,
  kind: "block",
  feedIds,
});
const only = (id: number, text: string, feedIds: number[] = []): Rule => ({
  id,
  text,
  kind: "only",
  feedIds,
});

const sports = block(3, "sports");
const rules = [sports, block(9, "Is it an advertisement?")];

describe("question", () => {
  test("wraps a topic and keeps a question as written", () => {
    expect(question(" sports ")).toBe("Is this article about sports?");
    expect(question("Is it an advertisement?")).toBe("Is it an advertisement?");
  });
});

describe("buildQuestions", () => {
  test("keys each rule by its id", () => {
    expect(buildQuestions(rules)).toEqual([
      { key: "r3", instructions: "Is this article about sports?" },
      { key: "r9", instructions: "Is it an advertisement?" },
    ]);
  });
});

describe("rulesFor", () => {
  test("keeps rules for every feed and rules limited to this feed", () => {
    const all = block(1, "a");
    const mine = only(2, "b", [7, 8]);
    const other = block(3, "c", [9]);
    expect(rulesFor([all, mine, other], 7)).toEqual([all, mine]);
    expect(rulesFor([all, mine, other], 9)).toEqual([all, other]);
  });
});

describe("verdict", () => {
  test("blocks at 0.5 and passes below", () => {
    expect(verdict(answers(["r3", 0.5], ["r9", 0.1]), rules)).toEqual({
      kind: "block",
      rule: sports,
    });
    expect(verdict(answers(["r3", 0.49], ["r9", 0.1]), rules)).toEqual({ kind: "pass" });
  });

  test("reports the first blocking rule", () => {
    expect(verdict(answers(["r3", 0.9], ["r9", 0.9]), rules)).toEqual({
      kind: "block",
      rule: sports,
    });
  });

  test("passes with no rules", () => {
    expect(verdict(new Map(), [])).toEqual({ kind: "pass" });
  });

  test("treats a missing answer as a jev failure", () => {
    expect(() => verdict(answers(["r3", 0.1]), rules)).toThrow(JevError);
    expect(() => verdict(answers(["r3", 0.9]), rules)).toThrow(JevError);
  });

  test("with only-rules, needs one of them to match", () => {
    const europe = only(4, "Europe");
    const space = only(5, "space");
    const both = [europe, space];
    expect(verdict(answers(["r4", 0.2], ["r5", 0.49]), both)).toEqual({ kind: "off-topic" });
    expect(verdict(answers(["r4", 0.2], ["r5", 0.5]), both)).toEqual({ kind: "pass" });
  });

  test("a matching block rule wins over a matching only-rule", () => {
    const mixed = [only(4, "Europe"), sports];
    expect(verdict(answers(["r4", 0.9], ["r3", 0.9]), mixed)).toEqual({
      kind: "block",
      rule: sports,
    });
  });
});

describe("describeRule", () => {
  const feeds = [
    { id: 7, name: "TASS" },
    { id: 8, name: "Euronews" },
  ];

  test("names the kind, the question and the feeds it applies to", () => {
    expect(describeRule(block(1, "sports"), feeds)).toBe(
      "🚫 Is this article about sports? (all feeds)",
    );
    expect(describeRule(only(2, "Europe", [8, 7]), feeds)).toBe(
      "✅ only: Is this article about Europe? (TASS, Euronews)",
    );
  });
});

describe("articleState", () => {
  test("is the title, a blank line, then the description", () => {
    expect(
      articleState({
        title: "T",
        link: null,
        guid: null,
        description: "D",
        publishedAt: null,
        image: null,
      }),
    ).toBe("T\n\nD");
  });
});
