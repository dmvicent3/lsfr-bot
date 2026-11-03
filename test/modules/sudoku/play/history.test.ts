import { expect, test } from "bun:test";
import { check } from "../../../../src/modules/sudoku/play/check.ts";
import { clear } from "../../../../src/modules/sudoku/play/clear.ts";
import { pop, push } from "../../../../src/modules/sudoku/play/history.ts";
import { toggleMode } from "../../../../src/modules/sudoku/play/mode.ts";
import { move } from "../../../../src/modules/sudoku/play/move.ts";
import { put } from "../../../../src/modules/sudoku/play/put.ts";
import type { Game, Snapshot } from "../../../../src/modules/sudoku/types.ts";
import { makeGame, setAt } from "./game.ts";

const snap = (cursor: number): Snapshot => ({ cells: "c", notes: "", cursor });

function depth(g: Game): number {
  const list: unknown[] = g.history === "" ? [] : JSON.parse(g.history);

  return list.length;
}

test("pop on '' is null", () => {
  expect(pop("")).toBeNull();
});

test("push then pop gives the snapshot back and '' again", () => {
  expect(pop(push("", snap(3)))).toEqual({ snapshot: snap(3), history: "" });
});

test("pop takes the newest first", () => {
  const got = pop(push(push("", snap(1)), snap(2)));

  expect(got?.snapshot).toEqual(snap(2));
  expect(pop(got?.history ?? "")?.snapshot).toEqual(snap(1));
});

test("history keeps the newest 50", () => {
  let h = "";

  for (let i = 0; i < 51; i++) h = push(h, snap(i));

  const list: Snapshot[] = JSON.parse(h);

  expect(list).toHaveLength(50);
  expect(list[0]?.cursor).toBe(1);
  expect(list[49]?.cursor).toBe(50);
});

test("each edit pushes one snapshot of the state before it", () => {
  const g = makeGame();
  const placed = put(g, 4).game;
  const noted = put({ ...g, noteMode: true }, 4).game;
  const cleared = clear(placed).game;

  expect(pop(placed.history)?.snapshot).toEqual({ cells: g.cells, notes: "", cursor: 2 });
  expect(depth(noted)).toBe(1);
  expect(depth(cleared)).toBe(2);
  expect(pop(cleared.history)?.snapshot.cells).toBe(placed.cells);
});

test("unchanged edits push nothing", () => {
  const filled = makeGame({ cells: setAt(makeGame().cells, 2, "4") });
  const empty = makeGame();

  expect(depth(put(filled, 4).game)).toBe(0);
  expect(depth(put(makeGame({ cursor: 0 }), 4).game)).toBe(0);
  expect(depth(put({ ...filled, noteMode: true }, 4).game)).toBe(0);
  expect(depth(clear(empty).game)).toBe(0);
});

test("move, mode and check push nothing", () => {
  const g = makeGame();

  expect(depth(move(g, "left").game)).toBe(0);
  expect(depth(toggleMode(g).game)).toBe(0);
  expect(depth(check(g).game)).toBe(0);
});
