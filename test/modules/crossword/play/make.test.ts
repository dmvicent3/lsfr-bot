import { expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { build, dailyMake, practiceMake } from "../../../../src/modules/crossword/play/make.ts";
import { freshDb } from "../store/fixtures.ts";

const ask = async () => "";

test("a daily puzzle is built from the date seed, with a clue per slot", async () => {
  const { repo } = freshDb();
  const v = { guildId: "g", date: "2026-11-03" };
  const a = await dailyMake(repo, v, ask)();
  const b = await dailyMake(repo, v, ask)();

  expect(a?.puzzle.size).toBe(5);
  expect(a?.clues).toHaveLength(a?.puzzle.slots.length ?? -1);
  expect(a?.clues.every((c) => c.length > 0)).toBe(true);
  expect(b).toEqual(a);
});

test("a daily puzzle avoids yesterday's answers", async () => {
  const { repo } = freshDb();
  const v = { guildId: "g", date: "2026-11-03" };
  // Yesterday holds exactly the answers today would pick without avoiding them.
  const yesterday = await dailyMake(repo, v, ask)();
  repo.puzzles.create("g", "2026-11-02", yesterday!);
  const today = await dailyMake(repo, v, ask)();

  for (const word of today!.puzzle.answers) {
    expect(yesterday!.puzzle.answers).not.toContain(word);
  }
});

test("practice builds the asked size from the given random", async () => {
  const seven = await practiceMake(7, lcg(3), ask)();
  const again = await practiceMake(7, lcg(3), ask)();

  expect(seven?.puzzle.size).toBe(7);
  expect(again).toEqual(seven);
});

test("no grid means null", async () => {
  expect(await build({ bank: [], size: 5, random: lcg(1), avoid: new Set() }, null)).toBeNull();
});

const DAY = 86_400_000;
const dateAt = (start: string, i: number): string =>
  new Date(Date.parse(start) + i * DAY).toISOString().slice(0, 10);

test("60 daily puzzles in a row: no answer within 30 days, no two days alike", async () => {
  const { repo } = freshDb();
  const days: string[][] = [];

  for (let i = 0; i < 60; i++) {
    const date = dateAt("2026-11-04", i);
    const made = await dailyMake(repo, { guildId: "123456789012345678", date }, null)();

    repo.puzzles.create("123456789012345678", date, made!);
    days.push(made!.puzzle.answers);
  }

  days.forEach((answers, i) => {
    for (let j = Math.max(0, i - 30); j < i; j++) {
      expect(answers.filter((a) => days[j]!.includes(a))).toEqual([]);
    }
  });
  expect(new Set(days.map((d) => d.toSorted().join())).size).toBe(60);
}, 60_000);
