import { expect, test } from "bun:test";
import { boardLines, squares } from "../../../../src/modules/word/render/board.ts";

test("squares", () => expect(squares(["hit", "near", "miss"])).toBe("🟩🟨⬛"));

test("board line shows spaced capitals and squares", () => {
  expect(boardLines(["crane"], "crate")).toBe("`C R A N E` 🟩🟩🟩⬛🟩");
});

test("one line per guess", () => {
  expect(boardLines(["slate", "crate"], "crate").split("\n")).toHaveLength(2);
});
