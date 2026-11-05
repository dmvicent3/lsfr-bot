import { expect, test } from "bun:test";
import { multiShareText } from "../../../../src/modules/word/multi/share-text.ts";
import { multiGame } from "../fixtures.ts";

const finished = { won: true, found: 2, points: 150, streak: 1, finishedAt: 1 };

test("a Duo win: the attempts, then the squares side by side, no letters", () => {
  const game = multiGame({ ...finished, date: "2026-11-06", guesses: ["slate", "bumpy", "crane"] });
  const t = multiShareText(game, ["crane", "slate"]);

  expect(t).toBe(
    ["<@u> solved Word Duo #2 in 3/7", "⬛⬛🟩⬛🟩 │ 🟩🟩🟩🟩🟩", "⬛⬛⬛⬛⬛", "🟩🟩🟩🟩🟩"].join(
      "\n",
    ),
  );
  expect(t.toLowerCase()).not.toMatch(/crane|slate|bumpy/);
});

test("a loss or give-up says X and the words found", () => {
  const lost = multiGame({ ...finished, won: false, found: 1, guesses: ["crane"] });
  expect(multiShareText(lost, ["crane", "slate"])).toBe(
    "<@u> missed Word Duo #1 — X/7 · 1/2 found\n🟩🟩🟩🟩🟩 │ ⬛⬛🟩⬛🟩",
  );

  const gaveUp = multiGame({ ...finished, mode: "quad", won: false, found: 0, guesses: [] });
  expect(multiShareText(gaveUp, ["crane", "slate", "bumpy", "fjord"])).toBe(
    "<@u> missed Word Quad #1 — X/9 · 0/4 found",
  );
});

test("Quad's squares go two by two, a blank line between the pairs", () => {
  const game = multiGame({ ...finished, mode: "quad", won: false, found: 1, guesses: ["crane"] });
  expect(multiShareText(game, ["crane", "slate", "bumpy", "fjord"])).toBe(
    [
      "<@u> missed Word Quad #1 — X/9 · 1/4 found",
      "🟩🟩🟩🟩🟩 │ ⬛⬛🟩⬛🟩",
      "",
      "⬛⬛⬛⬛⬛ │ ⬛🟨⬛⬛⬛",
    ].join("\n"),
  );
});
