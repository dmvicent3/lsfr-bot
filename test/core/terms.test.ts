import { expect, test } from "bun:test";
import { matchWords, terms } from "../../src/core/terms.ts";

test("a message's search terms: lowercase, no filler words, no repeats", () => {
  expect(terms("Give me FP1 results for the current session of F1, F1!")).toEqual([
    "fp1",
    "results",
    "session",
    "f1",
  ]);
});

test("free practice and FP1/FP2/FP3 find each other", () => {
  expect(matchWords("latest free practice results")).toContain("fp");
  expect(matchWords("fp2 times")).toContain("practice");
  expect(terms("fp2 times")).toEqual(["fp2", "times"]);
});

test("greetings and Gork's own name aren't searched for", () => {
  expect(terms("hey Gork, who's the goat of f1? thanks lol")).toEqual(["goat", "f1"]);
});

test("F1 also matches Formula 1, PM also prime minister", () => {
  expect(matchWords("goat of f1")).toContain("formula 1");
  expect(matchWords("uk pm")).toContain("prime minister");
});
