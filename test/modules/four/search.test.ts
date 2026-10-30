import { expect, test } from "bun:test";
import { emptyBoard, legalColumns } from "../../../src/modules/four/board.ts";
import { candidates } from "../../../src/modules/four/candidates.ts";
import { SEARCH_DEPTH, lostColumns } from "../../../src/modules/four/search.ts";
import { board } from "./fixtures.ts";

test("a drop under the other side's winning spot is lost two plies out", () => {
  expect(lostColumns(board(["RRR....", "YRY.YR."]), "Y", 2)).toEqual([3]);
});

test("an open two Red can turn into two threats is lost four plies out", () => {
  expect(lostColumns(board([".RR...."]), "Y", 2)).toEqual([]);
  expect(lostColumns(board([".RR...."]), "Y", 4)).toEqual([1, 2, 5, 6]);
});

test("a column that wins now is never lost", () => {
  expect(lostColumns(board(["YYY.RR."]), "Y", SEARCH_DEPTH)).not.toContain(3);
});

test("the full-depth search of the empty board is quick", () => {
  const start = performance.now();
  expect(lostColumns(emptyBoard(), "Y", SEARCH_DEPTH)).toEqual([]);
  expect(performance.now() - start).toBeLessThan(1000);
});

test("easy picks from every column, even past a win", () => {
  expect(candidates(board(["YYY.RR."]), "Y", "easy")).toEqual({
    cols: [0, 1, 2, 3, 4, 5, 6],
    forced: false,
  });
});

test("normal and hard play a forced win", () => {
  const b = board(["YYY.RR."]);
  expect(candidates(b, "Y", "normal")).toEqual({ cols: [3], forced: true });
  expect(candidates(b, "Y", "hard")).toEqual({ cols: [3], forced: true });
});

test("normal keeps a losing column, hard leaves it out", () => {
  const b = board([".RR...."]);
  expect(candidates(b, "Y", "normal").cols).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(candidates(b, "Y", "hard")).toEqual({ cols: [0, 3, 4], forced: false });
});

test("hard falls back to every column when all of them lose", () => {
  // Found by random play-outs: nothing to win or block now, yet Red wins whatever Yellow does.
  const b = board(["..Y....", "..R....", "..Y.Y.R", "..Y.Y.Y", "..Y.RRR", ".RR.YRR"]);
  const lost = lostColumns(b, "Y", SEARCH_DEPTH);
  expect(lost).toEqual(legalColumns(b));
  expect(candidates(b, "Y", "hard")).toEqual({ cols: legalColumns(b), forced: false });
});
