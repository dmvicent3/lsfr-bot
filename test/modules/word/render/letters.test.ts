import { expect, test } from "bun:test";
import { lettersText } from "../../../../src/modules/word/render/letters.ts";

const PUZZLE = { guildId: "g", date: "2026-10-29", word: "shore", length: 5 };

test("no guesses point to /word guess", () => {
  expect(lettersText({ puzzle: PUZZLE, guesses: [] })).toBe(
    "**Word #2** · letters\nNo guesses yet. Guess with `/word guess`.",
  );
});

test("groups, positions and the pattern", () => {
  expect(lettersText({ puzzle: PUZZLE, guesses: ["crane", "stove"] })).toBe(
    [
      "**Word #2** · letters",
      "🟩 S (1st) · O (3rd) · E (5th)",
      "🟨 R — not 2nd",
      "⬜ B D F G H I J K L M P Q U W X Y Z",
      "⬛ A C N T V",
      "",
      "Pattern: `S _ O _ E`",
    ].join("\n"),
  );
});

test("several spots and empty groups left out", () => {
  const t = lettersText({ puzzle: { ...PUZZLE, word: "rebus" }, guesses: ["error"] });
  expect(t).toContain("🟨 E — not 1st · R — not 2nd, 3rd, 5th");
  expect(t).not.toContain("🟩");
  expect(t).not.toContain("Pattern");
});
