import { expect, test } from "bun:test";
import { multiText } from "../../../../src/modules/word/multi/board-text.ts";
import type { MultiPuzzle } from "../../../../src/modules/word/multi/types.ts";
import { multiGame } from "../fixtures.ts";

const DUO: MultiPuzzle = {
  guildId: "g",
  mode: "duo",
  date: "2026-11-06",
  words: ["crane", "slate"],
  length: 5,
};
/** 12:00 Lisbon: 12h to the next puzzle. */
const NOW = Date.UTC(2026, 10, 6, 12);
const view = (over = {}, puzzle = DUO) =>
  multiText({
    puzzle,
    game: multiGame({ date: puzzle.date, ...over }),
    now: NOW,
    timeZone: "Europe/Lisbon",
  });

test("before a guess: heading and how to play", () => {
  expect(multiText({ puzzle: DUO, game: null, now: NOW, timeZone: "Europe/Lisbon" })).toBe(
    "**Word Duo #2** · attempts left 7\nEvery guess counts on every board. Guess with `/duo guess`.",
  );
});

test("both boards on one line per guess; a solved board's column empties", () => {
  expect(view({ guesses: ["slate", "bumpy"] })).toBe(
    [
      "**Word Duo #2** · attempts left 5",
      "**Board 1** │ **Board 2** ✅",
      "`SLATE` ⬛⬛🟩⬛🟩 │ 🟩🟩🟩🟩🟩",
      "`BUMPY` ⬛⬛⬛⬛⬛",
    ].join("\n"),
  );
  expect(view({ guesses: ["crane", "bumpy"] })).toContain("`BUMPY` │ ⬛⬛⬛⬛⬛");
});

test("a win shows the award and the wait", () => {
  const won = {
    guesses: ["slate", "crane"],
    won: true,
    found: 2,
    points: 150,
    streak: 1,
    finishedAt: 1,
  };
  expect(view(won)).toEndWith(
    [
      "",
      "All 2 solved!",
      "+150 pts (100 for 2 words, 50 for 5 unused attempts)",
      "Next puzzle in 12h 0m.",
    ].join("\n"),
  );
  expect(view(won)).toStartWith("**Word Duo #2** · 2/2 solved\n**Board 1** ✅ │ **Board 2** ✅");
});

test("a loss reveals the unsolved words", () => {
  const seven = ["slate", "bumpy", "fjord", "glyph", "jumpy", "nymph", "vixen"];
  const t = view({ guesses: seven, won: false, found: 1, points: 50, streak: 0, finishedAt: 1 });
  expect(t).toContain("**Board 1** ❌ **CRANE** │ **Board 2** ✅");
  expect(t).toContain("Out of attempts.\n+50 pts (50 for 1 word)");
});

test("giving up says so", () => {
  const t = view({ guesses: [], won: false, found: 0, points: 0, streak: 0, finishedAt: 1 });
  expect(t).toContain("**Board 2** ❌ **SLATE**");
  expect(t).toContain("You gave up.\n+0 pts (no words found)");
});

/** Quad at 7 letters where every square is green or yellow: four rotations, nine anagrams. */
const WORST: MultiPuzzle = {
  guildId: "g",
  mode: "quad",
  date: "2026-11-06",
  words: ["abcdefg", "bcdefga", "cdefgab", "defgabc"],
  length: 7,
};
const ANAGRAMS = [
  "gfedcba",
  "fedcbag",
  "edcbagf",
  "dcbagfe",
  "cbagfed",
  "bagfedc",
  "agfedcb",
  "gabcdef",
  "fgabcde",
];

test("Quad's longest board fits a Discord message", () => {
  const playing = view({ guesses: ANAGRAMS.slice(0, 8) }, WORST);
  const lost = view(
    { guesses: ANAGRAMS, won: false, found: 0, points: 0, streak: 0, finishedAt: 1 },
    WORST,
  );
  expect(playing).not.toContain("⬛");
  expect(lost.split("\n").filter((l) => l.startsWith("`"))).toHaveLength(18);
  expect(lost).toContain("**Board 3** ❌ **CDEFGAB** │ **Board 4** ❌ **DEFGABC**");
  expect(lost.length).toBeLessThan(2000);
  expect(playing.length).toBeLessThan(2000);
});

test("Quad is two blocks of two, each guess once per block", () => {
  expect(view({ guesses: ANAGRAMS.slice(0, 2) }, WORST)).toBe(
    [
      "**Word Quad #2** · attempts left 7",
      "**Board 1** │ **Board 2**",
      "`GFEDCBA` 🟨🟨🟨🟩🟨🟨🟨 │ 🟨🟨🟨🟨🟨🟨🟩",
      "`FEDCBAG` 🟨🟨🟨🟨🟨🟨🟩 │ 🟨🟨🟩🟨🟨🟨🟨",
      "",
      "**Board 3** │ **Board 4**",
      "`GFEDCBA` 🟨🟨🟩🟨🟨🟨🟨 │ 🟨🟨🟨🟨🟨🟩🟨",
      "`FEDCBAG` 🟨🟨🟨🟨🟨🟩🟨 │ 🟨🟩🟨🟨🟨🟨🟨",
    ].join("\n"),
  );
});
