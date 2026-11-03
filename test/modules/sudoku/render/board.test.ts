import { expect, test } from "bun:test";
import { renderBoard } from "../../../../src/modules/sudoku/render/board.ts";
import type { Game } from "../../../../src/modules/sudoku/types.ts";
import { EASY_SOLUTION } from "../fixtures.ts";

const G = "\u001b[0;37m";
const B = "\u001b[0;34m";
const R = "\u001b[0;31m";
const X = "\u001b[0m";

const GIVENS = `530070000${"0".repeat(72)}`;
const CELLS = `534270000${"0".repeat(72)}`;
const WRONG = `000100000${"0".repeat(72)}`;

const GAME: Game = {
  guildId: "g",
  userId: "u",
  kind: "daily",
  date: "2026-11-03",
  slot: "easy",
  level: "easy",
  givens: GIVENS,
  solution: EASY_SOLUTION,
  cells: CELLS,
  wrong: WRONG,
  cursor: 0,
  checks: 0,
  startedAt: 0,
  solvedAt: null,
  points: null,
  streak: null,
  notes: "",
  noteMode: false,
};

const EMPTY = " · ";
const EMPTY_ROW = (n: number): string =>
  `${n} │${EMPTY}${EMPTY}${EMPTY}│${EMPTY}${EMPTY}${EMPTY}│${EMPTY}${EMPTY}${EMPTY}│`;
const MID = "  ├─────────┼─────────┼─────────┤";

const EXPECTED = [
  "```ansi",
  "    A  B  C   D  E  F   G  H  I",
  "  ┌─────────┬─────────┬─────────┐",
  `1 │[${G}5${X}] ${G}3${X}  ${B}4${X} │ ${R}2${X}  ${G}7${X} ${EMPTY}│${EMPTY}${EMPTY}${EMPTY}│`,
  EMPTY_ROW(2),
  EMPTY_ROW(3),
  MID,
  EMPTY_ROW(4),
  EMPTY_ROW(5),
  EMPTY_ROW(6),
  MID,
  EMPTY_ROW(7),
  EMPTY_ROW(8),
  EMPTY_ROW(9),
  "  └─────────┴─────────┴─────────┘",
  "```",
].join("\n");

test("exact board: cursor on a given, a given, an entry, a red cell, empties plain", () => {
  expect(renderBoard(GAME)).toBe(EXPECTED);
});

test("the cursor on an empty cell shows brackets around the dot", () => {
  expect(renderBoard({ ...GAME, cursor: 8 }).split("\n")[3]).toEndWith(" ·  · [·]│");
});
