import { expect, test } from "bun:test";
import { resultLine } from "../../../../src/modules/crossword/render/result.ts";
import type { Game } from "../../../../src/modules/crossword/types.ts";

const G: Game = {
  guildId: "g",
  date: "2026-11-05",
  userId: "u1",
  cells: "",
  wrong: 2,
  reveals: 1,
  lastLine: null,
  solved: true,
  points: 80,
  streak: 1,
  startedAt: 1_000_000,
  finishedAt: 1_000_000 + 134_000,
};

test("solved announcement", () => {
  expect(resultLine(3, G)).toBe(
    "<@u1> solved Crossword #3 — 80 pts · 2 mistakes · 1 reveals · 2:14",
  );
});

test("gave up announcement", () => {
  expect(resultLine(3, { ...G, solved: false, points: 0 })).toBe("<@u1> gave up on Crossword #3");
});
