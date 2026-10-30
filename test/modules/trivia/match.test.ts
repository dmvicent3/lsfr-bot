import { expect, test } from "bun:test";
import { levenshtein, matches, normalize } from "../../../src/modules/trivia/match.ts";

test("normalize lowercases, trims, drops punctuation and a leading article", () => {
  expect(normalize("  The  Beatles! ")).toBe("beatles");
  expect(normalize("An Apple")).toBe("apple");
  expect(normalize("Theatre")).toBe("theatre");
});

test("normalize strips accents", () => {
  expect(normalize("Pokémon")).toBe("pokemon");
  expect(normalize("São Paulo")).toBe("sao paulo");
});

test("normalize drops mentions, custom emoji and emoji", () => {
  expect(normalize("<@123> paris")).toBe("paris");
  expect(normalize("<:pog:42> paris 🎉")).toBe("paris");
  expect(normalize("Paris!!")).toBe("paris");
});

test("levenshtein", () => {
  expect(levenshtein("kitten", "sitting")).toBe(3);
  expect(levenshtein("", "abc")).toBe(3);
  expect(levenshtein("same", "same")).toBe(0);
});

test("exact after normalising matches", () => {
  expect(matches("the paris", "Paris")).toBe(true);
  expect(matches("new-york", "New York")).toBe(true);
});

test("one typo is allowed on answers of 6+ letters only", () => {
  expect(matches("permision", "permission")).toBe(true);
  expect(matches("permisin", "permission")).toBe(false);
  expect(matches("pari", "paris")).toBe(false);
});

test("numbers must be exact", () => {
  expect(matches("12", "13")).toBe(false);
  expect(matches("apollo 12", "Apollo 11")).toBe(false);
  expect(matches("apollo 11", "Apollo 11")).toBe(true);
});

test("empty or mention-only messages never match", () => {
  expect(matches("", "Paris")).toBe(false);
  expect(matches("<@123>", "Paris")).toBe(false);
  expect(matches("!!!", "!!!")).toBe(false);
});
