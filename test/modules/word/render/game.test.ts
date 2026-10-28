import { expect, test } from "bun:test";
import { gameText } from "../../../../src/modules/word/render/game.ts";
import { game } from "../fixtures.ts";

const PUZZLE = { guildId: "g", date: "2026-10-29", word: "crane", length: 5 };
const NOW = Date.UTC(2026, 9, 29, 18, 30);
const base = { puzzle: PUZZLE, now: NOW, timeZone: "Europe/Lisbon", award: null };

test("a new game says how to guess", () => {
  const t = gameText({ ...base, game: null });
  expect(t).toBe("**Word #2** · 5 letters\nAttempts left: 6. Guess with `/word guess`.");
});

test("an open game shows its board and attempts left", () => {
  const open = game("u", PUZZLE.date, {
    guesses: ["slate"],
    won: null,
    points: null,
    finishedAt: null,
  });
  expect(gameText({ ...base, game: open })).toBe(
    "**Word #2** · 5 letters\n`S L A T E` ⬛⬛🟩⬛🟩\nAttempts left: 5.",
  );
});

test("a finished game reveals the word, the points and the wait", () => {
  const done = game("u", PUZZLE.date, { guesses: ["crane"], points: 150 });
  const t = gameText({
    ...base,
    game: done,
    award: { points: 150, parts: ["100 solved", "50 for 5 unused attempts"] },
  });
  expect(t).toContain("The word was **CRANE**.");
  expect(t).toContain("+150 pts (100 solved, 50 for 5 unused attempts)");
  expect(t).toContain("Next puzzle in 5h 30m.");
});

test("a finished game seen again shows its stored points", () => {
  const done = game("u", PUZZLE.date, { guesses: ["crane"], points: 150 });
  expect(gameText({ ...base, game: done })).toContain("+150 pts");
});
