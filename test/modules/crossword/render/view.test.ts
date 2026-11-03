import { expect, test } from "bun:test";
import { boardView } from "../../../../src/modules/crossword/render/board-view.ts";
import { newId, slotKey } from "../../../../src/modules/crossword/render/ids.ts";
import { crosswordView } from "../../../../src/modules/crossword/render/view.ts";
import type { Game, Practice } from "../../../../src/modules/crossword/types.ts";
import { bigView, SQUARE, V } from "./fixtures.ts";

const ids = (v: ReturnType<typeof crosswordView>) =>
  v.components.map((r) => r.components.map((c) => (c as { custom_id: string }).custom_id));

test("daily in progress: select, reveal and give up", () => {
  const v = crosswordView(V);

  expect(v.allowedMentions).toEqual({ parse: [] });
  expect(ids(v)).toEqual([
    ["crossword:pick:2026-11-05:mh1x"],
    ["crossword:reveal:2026-11-05:mh1x", "crossword:giveup:2026-11-05:mh1x"],
  ]);
  expect(v.components[1]!.components.map((c) => ("style" in c ? c.style : 0))).toEqual([2, 4]);
});

test("practice in progress adds New for its size", () => {
  const v = crosswordView({ ...V, scope: "practice", number: null });

  expect(ids(v)[1]).toEqual([
    "crossword:reveal:practice:mh1x",
    "crossword:giveup:practice:mh1x",
    "crossword:new:5",
  ]);
});

test("daily finished: no components", () => {
  expect(crosswordView({ ...V, finished: true }).components).toEqual([]);
});

test("practice finished keeps New", () => {
  const v = crosswordView({ ...V, scope: "practice", number: null, finished: true });

  expect(ids(v)).toEqual([["crossword:new:5"]]);
});

test("the message is within 2000 characters", () => {
  expect(crosswordView(bigView()).content.length).toBeLessThanOrEqual(2000);
});

test("id builders", () => {
  expect(newId(7)).toBe("crossword:new:7");
  expect(slotKey({ n: 12, dir: "d" })).toBe("12d");
});

const GAME: Game = {
  guildId: "g",
  date: "2026-11-05",
  userId: "u",
  cells: "craneolive".padEnd(25, "."),
  wrong: 1,
  reveals: 0,
  lastLine: "x",
  solved: null,
  points: null,
  streak: null,
  startedAt: 36 * 36,
  finishedAt: null,
};
const WHERE = { scope: GAME.date, number: 3, stored: SQUARE };

test("boardView: running time, stamp in base 36, base points", () => {
  const v = boardView(WHERE, GAME, 36 * 36 + 61_000);

  expect(v).toMatchObject({
    stamp: "100",
    elapsedMs: 61_000,
    points: 95,
    finished: false,
    award: null,
    lastLine: "x",
  });
});

test("boardView: finished daily takes finishedAt and rebuilds its award", () => {
  const cells = "x".repeat(25);
  const done = { ...GAME, cells, solved: true, points: 100, streak: 2, finishedAt: 36 * 36 + 5000 };
  const v = boardView(WHERE, done, 9e9);

  expect(v.elapsedMs).toBe(5000);
  expect(v.points).toBe(100);
  expect(v.award).toEqual({ points: 100, parts: ["Solved: 100", "Mistakes: −5", "Streak 2: +5"] });
});

test("boardView: a given award wins; practice has none", () => {
  const practice: Practice = {
    ...SQUARE,
    guildId: "g",
    userId: "u",
    cells: GAME.cells,
    wrong: 0,
    reveals: 0,
    lastLine: null,
    startedAt: 0,
    finishedAt: 7,
  };
  const given = { points: 1, parts: ["a"] };

  expect(boardView({ ...WHERE, scope: "practice", number: null }, practice, 99).award).toBeNull();
  expect(boardView(WHERE, GAME, 0, given).award).toBe(given);
});
