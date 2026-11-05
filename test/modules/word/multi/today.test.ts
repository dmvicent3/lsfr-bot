import { beforeEach, expect, test } from "bun:test";
import { todayMulti } from "../../../../src/modules/word/multi/today.ts";
import { todayPuzzle } from "../../../../src/modules/word/play/today.ts";
import { DEFAULT_SETTINGS } from "../../../../src/modules/word/settings.ts";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { wordLists } from "../../../../src/modules/word/words/load.ts";
import { freshDb } from "../fixtures.ts";

let repo: WordRepo;
/** 12:00 Lisbon on 2026-11-05. */
const NOW = Date.UTC(2026, 10, 5, 12);
const DAY = 86_400_000;

beforeEach(() => {
  repo = freshDb().repo;
});

const at = (over: { length?: number; now?: number; random?: () => number } = {}) => ({
  guildId: "g",
  settings: { ...DEFAULT_SETTINGS, length: over.length ?? 5 },
  now: over.now ?? NOW,
  random: over.random ?? (() => 0),
});

test("Quad gets four distinct answers, none of them the classic word", () => {
  const quad = todayMulti(repo, at(), "quad");
  const classic = todayPuzzle(repo, at());
  expect(quad).toMatchObject({ guildId: "g", mode: "quad", date: "2026-11-05", length: 5 });
  expect(new Set(quad.words).size).toBe(4);
  expect(quad.words).not.toContain(classic.word);
  expect(quad.words.every((w) => wordLists(5)?.answers.includes(w))).toBe(true);
});

test("created once a day, shared, and apart from the other mode's words", () => {
  const duo = todayMulti(repo, at(), "duo");
  expect(todayMulti(repo, at({ random: () => 0.99 }), "duo")).toEqual(duo);
  const quad = todayMulti(repo, at(), "quad");
  expect(quad.words.some((w) => duo.words.includes(w))).toBe(false);
});

test("the next day avoids every word used before", () => {
  const first = todayMulti(repo, at(), "duo");
  const next = todayMulti(repo, at({ now: NOW + DAY }), "duo");
  expect(next.date).toBe("2026-11-06");
  expect(next.words.some((w) => first.words.includes(w))).toBe(false);
});

test("the length follows the day's classic puzzle", () => {
  todayPuzzle(repo, at());
  expect(todayMulti(repo, at({ length: 7 }), "duo").length).toBe(5);
  expect(todayMulti(repo, at({ length: 7, now: NOW + DAY }), "duo").words[0]).toHaveLength(7);
});
