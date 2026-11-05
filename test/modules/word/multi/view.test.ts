import { expect, test } from "bun:test";
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

test("an open game has Give up; guesses are /quad guess", () => {
  const v = multiView({ puzzle: QUAD, game: null, ...at });
  expect(v.content).toBe(
    "**Word Quad #1** · attempts left 9\nEvery guess counts on every board. Guess with `/quad guess`.",
  );
  expect(v.components[0]?.components.map((b) => [b.custom_id, b.label])).toEqual([
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
