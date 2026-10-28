import { beforeEach, expect, test } from "bun:test";
import { todayPuzzle } from "../../../../src/modules/word/play/today.ts";
import { DEFAULT_SETTINGS } from "../../../../src/modules/word/settings.ts";
import type { WordRepo } from "../../../../src/modules/word/store/repo.ts";
import { wordLists } from "../../../../src/modules/word/words/load.ts";
import { freshDb } from "../fixtures.ts";

let repo: WordRepo;
/** 12:00 Lisbon on 2026-10-28. */
const NOW = Date.UTC(2026, 9, 28, 11);
const DAY = 86_400_000;

beforeEach(() => {
  repo = freshDb().repo;
});

const today = (over: { length?: number; now?: number; random?: () => number } = {}) =>
  todayPuzzle(repo, {
    guildId: "g",
    settings: { ...DEFAULT_SETTINGS, length: over.length ?? 5 },
    now: over.now ?? NOW,
    random: over.random ?? (() => 0),
  });

test("today's puzzle is created once and shared", () => {
  const a = today();
  expect(today({ random: () => 0.99 })).toEqual(a);
  expect(a).toMatchObject({ guildId: "g", date: "2026-10-28", length: 5 });
  expect(wordLists(5)?.answers).toContain(a.word);
});

test("a length change waits for the next day", () => {
  const a = today();
  expect(today({ length: 6 }).word).toBe(a.word);
  expect(today({ length: 6, now: NOW + DAY }).length).toBe(6);
});

test("the next day gets a different word", () => {
  expect(today({ now: NOW + DAY }).word).not.toBe(today().word);
});

test("the date follows the server's time zone", () => {
  const late = Date.UTC(2026, 9, 28, 23, 30);
  const p = todayPuzzle(repo, {
    guildId: "g",
    settings: { length: 5, timeZone: "Asia/Tokyo" },
    now: late,
    random: () => 0,
  });
  expect(p.date).toBe("2026-10-29");
});
