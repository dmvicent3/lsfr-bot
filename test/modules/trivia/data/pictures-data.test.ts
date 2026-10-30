import { expect, test } from "bun:test";
import { isBanned } from "../../../../src/modules/trivia/data/banned.ts";
import { pictures } from "../../../../src/modules/trivia/data/load.ts";

const all = pictures();

test("ids are unique and never meet Open Trivia DB ids", () => {
  expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
  expect(Math.min(...all.map((p) => p.id))).toBeGreaterThanOrEqual(100_001);
});

test("every picture has an image and an answer", () => {
  for (const p of all) {
    expect(p.image, String(p.id)).not.toBe("");
    expect(p.answer.trim(), String(p.id)).not.toBe("");
  }
});

test("every category is there", () => {
  const categories = new Set(all.map((p) => p.category));

  expect([...categories].toSorted()).toEqual([
    "Flags",
    "Landmarks",
    "Logos",
    "Painters",
    "Paintings",
    "People",
  ]);
});

test("no banned topics", () => {
  expect(
    all.filter((p) => isBanned({ question: p.answer, answer: p.answer, wrong: p.aliases })),
  ).toEqual([]);
});
