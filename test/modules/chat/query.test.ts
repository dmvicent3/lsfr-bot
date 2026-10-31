import { expect, test } from "bun:test";
import { searchQuery } from "../../../src/modules/chat/query.ts";

test("a full question is searched as it is", () => {
  expect(searchQuery("who won the last formula 1 race?", ["what is f1"])).toBe(
    "who won the last formula 1 race?",
  );
});

test("a short follow-up is searched with the question before it", () => {
  expect(searchQuery("and the qualifying?", ["give me fp1 results for f1", ""])).toBe(
    "give me fp1 results for f1 and the qualifying?",
  );
});

test("a short message with nothing before it, or no text at all, stays as it is", () => {
  expect(searchQuery("weather lisbon", [])).toBe("weather lisbon");
  expect(searchQuery("", ["give me fp1 results"])).toBe("");
});
