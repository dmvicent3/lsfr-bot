import { expect, test } from "bun:test";
import { multiLettersText } from "../../../../src/modules/word/multi/letters-text.ts";
import type { MultiPuzzle } from "../../../../src/modules/word/multi/types.ts";

const DUO: MultiPuzzle = {
  guildId: "g",
  mode: "duo",
  date: "2026-11-06",
  words: ["shore", "crane"],
  length: 5,
};

test("no guesses point to the mode's play command", () => {
  expect(multiLettersText({ puzzle: DUO, guesses: [] })).toBe(
    "**Word Duo #2** · letters\nNo guesses yet. Play with `/duo play`.",
  );
});

test("each unsolved board gets its notes; a solved one just its word", () => {
  expect(multiLettersText({ puzzle: DUO, guesses: ["crane", "stove"] })).toBe(
    [
      "**Word Duo #2** · letters",
      "**Board 1**",
      "🟩 S (1st) · O (3rd) · E (5th)",
      "🟨 R — not 2nd",
      "⬜ B D F G H I J K L M P Q U W X Y Z",
      "⬛ A C N T V",
      "Pattern: `S _ O _ E`",
      "",
      "**Board 2** ✅ CRANE",
    ].join("\n"),
  );
});

/**
 * Quad at 7 letters, found by a hill-climbing search for the longest text (1341 characters). The
 * bound: per board at most 7 letters in the word, each never hit and so ruled out of at most 6
 * spots ("X — not 1st, …, 6th", 36 characters), plus 19 letters untried or out: about 340 a board.
 */
const WORST: MultiPuzzle = {
  guildId: "g",
  mode: "quad",
  date: "2026-11-06",
  words: ["fgabdie", "fghbdic", "fgabdic", "fghbdie"],
  length: 7,
};
const GUESSES = [
  "haeeahd",
  "gffghba",
  "edghcgi",
  "iiccgaf",
  "aibebdi",
  "bciiqci",
  "chdffeh",
  "devaiag",
  "dbfdefb",
];

test("Quad's longest letter notes fit a Discord message", () => {
  const t = multiLettersText({ puzzle: WORST, guesses: GUESSES });

  expect(t.split("\n").filter((l) => l.startsWith("🟨"))).toHaveLength(4);
  expect(t.length).toBeGreaterThan(1300);
  expect(t.length).toBeLessThan(2000);
});
