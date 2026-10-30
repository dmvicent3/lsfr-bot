import { expect, test } from "bun:test";
import { isBanned } from "../../../../src/modules/trivia/data/banned.ts";

test("questions about Pokemon are banned, in any field or spelling", () => {
  expect(isBanned({ question: "Which Pokémon is #25?", answer: "Pikachu", wrong: [] })).toBe(true);
  expect(isBanned({ question: "Q?", answer: "POKEMON Red", wrong: [] })).toBe(true);
  expect(isBanned({ question: "Q?", answer: "A", wrong: ["Pokemon Go"] })).toBe(true);
});

test("everything else is kept", () => {
  expect(isBanned({ question: "Capital of France?", answer: "Paris", wrong: [] })).toBe(false);
});
