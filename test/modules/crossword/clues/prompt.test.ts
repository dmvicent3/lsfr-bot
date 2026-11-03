import { expect, test } from "bun:test";
import { cluePrompt } from "../../../../src/modules/crossword/clues/prompt.ts";

test("prompt lists every word with its definition", () => {
  const p = cluePrompt([{ word: "CAT", def: "a feline" }]);
  expect(p).toContain("CAT: a feline");
  expect(p).toContain('{"WORD":"clue"}');
});
