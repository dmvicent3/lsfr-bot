import { describe, expect, test } from "bun:test";
import { isInflection, snakeAnswers } from "../../../scripts/word-lists/snake-answers.ts";

const enable = new Set([
  "walk",
  "walks",
  "wish",
  "wishes",
  "try",
  "tried",
  "run",
  "running",
  "love",
  "loved",
  "glass",
  "always",
  "news",
  "thing",
  "planet",
  "example",
  "zebra",
  "stop",
  "stopped",
  "se",
]);

describe("isInflection", () => {
  test("plurals, third person, past and -ing forms of a dictionary word", () => {
    for (const w of ["walks", "wishes", "tried", "running", "loved", "stopped"]) {
      expect(isInflection(w, enable)).toBe(true);
    }
  });

  test("base words, -ss words and stems too short to count stay", () => {
    for (const w of ["walk", "glass", "planet", "thing", "seed"]) {
      expect(isInflection(w, enable)).toBe(false);
    }
  });
});

describe("snakeAnswers", () => {
  test("common dictionary words of 4–10 letters, not blocked, no inflections, sorted", () => {
    const frequent = ["the", "walks", "zebra", "walk", "planet", "example", "glass", "qwerty"];
    const out = snakeAnswers({ enable, frequent, blocked: new Set(["glass"]), common: 5 });
    expect(out).toEqual(["planet", "walk", "zebra"]);
  });
});
