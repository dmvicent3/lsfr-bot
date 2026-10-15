import { describe, expect, test } from "bun:test";
import { buildPrompt, splitMessage, stripMentions } from "./text.ts";

test("stripMentions removes user mentions", () => {
  expect(stripMentions("<@1> hi <@!2>")).toBe("hi");
});

describe("buildPrompt", () => {
  test("plain message", () => expect(buildPrompt("hi", null)).toBe("hi"));
  test("reply includes the original message", () => {
    expect(buildPrompt("why?", "the sky is blue")).toBe(
      "[Original message]: the sky is blue\n[User reply]: why?",
    );
  });
});

describe("splitMessage", () => {
  test("hard-splits long lines at the limit", () => {
    expect(splitMessage("a".repeat(4500)).map((c) => c.length)).toEqual([2000, 2000, 500]);
  });

  test("prefers the last newline inside the limit", () => {
    const chunks = splitMessage(`${"x".repeat(1990)}\n${"y".repeat(100)}`);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe("x".repeat(1990));
    expect(chunks[1]).toBe("y".repeat(100));
  });

  test("empty text gives no chunks", () => expect(splitMessage("")).toEqual([]));
});
