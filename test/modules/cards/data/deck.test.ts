import { expect, test } from "bun:test";
import { starterDeck } from "../../../../src/modules/cards/data/load.ts";
import { validateCard } from "../../../../src/modules/cards/text.ts";
import { normalize } from "../../../../src/modules/trivia/match.ts";

/** Words that never belong in the starter deck. */
const BANNED_WORDS = [
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "tranny",
  "kike",
  "spic",
  "chink",
  "paki",
];

const { prompts, answers } = starterDeck();

test("the starter deck is big enough", () => {
  expect(prompts.length).toBeGreaterThanOrEqual(140);
  expect(answers.length).toBeGreaterThanOrEqual(450);
});

test("every card passes the same rules as /cards add", () => {
  expect(prompts.filter((p) => !validateCard("prompt", p.text).ok).map((p) => p.text)).toEqual([]);
  expect(answers.filter((a) => !validateCard("answer", a.text).ok).map((a) => a.text)).toEqual([]);
});

test("no duplicates and no banned words", () => {
  const texts = [...prompts, ...answers].map((c) => normalize(c.text));
  const words = new Set(texts.flatMap((t) => t.split(" ")));

  expect(texts.length - new Set(texts).size).toBe(0);
  expect(BANNED_WORDS.filter((w) => words.has(w))).toEqual([]);
});

test("starter ids are stable and blank counts recorded", () => {
  expect(prompts[0]).toMatchObject({ id: "s:p0", blanks: 1 });
  expect(answers[0]?.id).toBe("s:a0");
  expect(prompts.some((p) => p.blanks === 2)).toBe(true);
});
