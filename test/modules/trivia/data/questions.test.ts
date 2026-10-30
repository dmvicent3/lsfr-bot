import { isBanned } from "../../../../src/modules/trivia/data/banned.ts";
import { expect, test } from "bun:test";
import { classify } from "../../../../src/modules/trivia/data/classify.ts";
import { questions } from "../../../../src/modules/trivia/data/load.ts";

const all = questions();

test("ids are unique", () => {
  expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
});

test("every question has an answer and 1 or 3 wrong options", () => {
  for (const q of all) {
    expect(q.answer.trim()).not.toBe("");
    expect([1, 3]).toContain(q.wrong.length);
  }
});

test("typed questions pass the typed rules", () => {
  for (const q of all.filter((t) => t.kind === "typed")) {
    const type = q.wrong.length === 1 ? "boolean" : "multiple";
    expect(classify({ type, question: q.question, answer: q.answer })).toBe("typed");
  }
});

test("enough of each kind", () => {
  expect(all.filter((q) => q.kind === "typed").length).toBeGreaterThanOrEqual(2_850);
  expect(all.filter((q) => q.kind === "choice").length).toBeGreaterThanOrEqual(1_800);
});

test("no banned topics", () => {
  expect(all.filter((q) => isBanned(q))).toEqual([]);
});
