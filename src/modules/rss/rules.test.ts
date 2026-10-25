import { describe, expect, test } from "bun:test";
import { JevError } from "../../core/jev.ts";
import { articleState, buildQuestions, question, verdict } from "./rules.ts";

const answers = (...pairs: [string, number][]) => new Map<string, number>(pairs);

const rules = [
  { id: 3, text: "sports" },
  { id: 9, text: "Is it an advertisement?" },
];

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

describe("verdict", () => {
  test("blocks at 0.5 and passes below", () => {
    expect(verdict(answers(["r3", 0.5], ["r9", 0.1]), rules)).toEqual({
      kind: "block",
      rule: { id: 3, text: "sports" },
    });
    expect(verdict(answers(["r3", 0.49], ["r9", 0.1]), rules)).toEqual({ kind: "pass" });
  });

  test("reports the first blocking rule", () => {
    expect(verdict(answers(["r3", 0.9], ["r9", 0.9]), rules)).toEqual({
      kind: "block",
      rule: { id: 3, text: "sports" },
    });
  });

  test("passes with no rules", () => {
    expect(verdict(new Map(), [])).toEqual({ kind: "pass" });
  });

  test("treats a missing answer as a jev failure", () => {
    expect(() => verdict(answers(["r3", 0.1]), rules)).toThrow(JevError);
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
