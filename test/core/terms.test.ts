import { expect, test } from "bun:test";
import { terms } from "../../src/core/terms.ts";

test("a message's search terms: lowercase, no filler words, no repeats", () => {
  expect(terms("Give me FP1 results for the current session of F1, F1!")).toEqual([
    "fp1",
    "results",
    "session",
    "f1",
  ]);
});
