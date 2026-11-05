import { expect, test } from "bun:test";
import { guessModal } from "../../../../src/modules/word/multi/modal.ts";
import type { MultiPuzzle } from "../../../../src/modules/word/multi/types.ts";
import { multiView } from "../../../../src/modules/word/multi/view.ts";
import { multiGame } from "../fixtures.ts";

const QUAD: MultiPuzzle = {
  guildId: "g",
  mode: "quad",
  date: "2026-11-05",
  words: ["crane", "slate", "bumpy", "fjord"],
  length: 5,
};
const at = { now: 0, timeZone: "Europe/Lisbon" };

test("an open game has Guess and Give up", () => {
  const v = multiView({ puzzle: QUAD, game: null, ...at });
  expect(v.content).toStartWith("**Word Quad #1** · attempts left 9");
  expect(v.components[0]?.components.map((b) => [b.custom_id, b.label])).toEqual([
    ["word:guess:quad:2026-11-05", "Guess"],
    ["word:giveup:quad:2026-11-05", "Give up"],
  ]);
});

test("a finished game has no buttons", () => {
  const game = multiGame({
    mode: "quad",
    won: false,
    found: 0,
    points: 0,
    streak: 0,
    finishedAt: 1,
  });
  expect(multiView({ puzzle: QUAD, game, ...at }).components).toEqual([]);
});

test("the modal asks for one word of the puzzle's length", () => {
  const m = guessModal({ ...QUAD, length: 6 }).toJSON();
  expect(m.custom_id).toBe("word:answer:quad:2026-11-05");
  expect(m.title).toBe("Word Quad #1");
  expect(JSON.stringify(m.components)).toContain('"label":"Your guess (6 letters)"');
  expect(JSON.stringify(m.components)).toContain('"min_length":6,"max_length":6');
});
