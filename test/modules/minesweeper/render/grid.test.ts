import { describe, expect, test } from "bun:test";
import { renderGrid } from "../../../../src/modules/minesweeper/render/grid.ts";
import type { Board } from "../../../../src/modules/minesweeper/types.ts";
import { board } from "../fixtures.ts";

const ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[\\d+m`, "g");

const plain = (text: string) => text.replace(ESCAPE, "");

const lines = (b: Board) => plain(renderGrid(b)).split("\n");

describe("renderGrid", () => {
  test("an ansi block with letters, row numbers and the cursor in brackets", () => {
    expect(lines(board(["*.o..", ".....", ".....", ".....", "....."]))).toEqual([
      "```ansi",
      "   A B C D E",
      " 1[■]■ · ■ ■",
      " 2 ■ ■ ■ ■ ■",
      " 3 ■ ■ ■ ■ ■",
      " 4 ■ ■ ■ ■ ■",
      " 5 ■ ■ ■ ■ ■",
      "```",
    ]);
  });

  test("numbers and flags show, a cursor in the last column closes at the line end", () => {
    const out = lines(board(["*o.", "F.o", "..."], { cursor: 5 }));
    expect(out[2]).toBe(" 1 ■ 2 ■");
    expect(out[3]).toBe(" 2 ⚑ ■[·]");
  });

  test("row labels are right-aligned to two characters", () => {
    const out = lines(board(Array.from({ length: 10 }, () => ".....")));
    expect(out[11]).toBe("10 ■ ■ ■ ■ ■");
  });

  test("a lost board shows mines, the hit and wrong flags, without the cursor", () => {
    const out = lines(board(["*F.", "f.o", "..."], { result: "lost", hit: 0, cursor: 4 }));
    expect(out[2]).toBe(" 1 X * ■");
    expect(out[3]).toBe(" 2 x ■ 1");
  });

  test("a won board shows its flagged mines", () => {
    const out = lines(board(["Foo", "ooo", "ooo"], { result: "won" }));
    expect(out[2]).toBe(" 1 ⚑ 1 ·");
  });

  test("digits are coloured classic-style", () => {
    const out = renderGrid(board(["*o.", "...", "..."], { cursor: 8 }));
    expect(out).toContain("\u001b[34m1");
    const two = renderGrid(board(["*o*", "...", "..."], { cursor: 8 }));
    expect(two).toContain("\u001b[32m2");
  });

  test("the hit and flags are red", () => {
    expect(renderGrid(board(["F..", "...", "..."], { cursor: 8 }))).toContain("\u001b[31m⚑");
  });

  test("the worst case fits an embed description", () => {
    const cells = Array.from({ length: 400 }, (_, i) =>
      (i + Math.floor(i / 20)) % 2 ? "flag" : "open",
    ) as Board["cells"];
    const worst: Board = {
      width: 20,
      height: 20,
      mines: 0,
      field: Array.from({ length: 400 }, () => false),
      cells,
      cursor: 0,
      hit: null,
      result: null,
    };
    expect(renderGrid(worst).length).toBeLessThan(3900);
  });
});
