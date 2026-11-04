import { expect, test } from "bun:test";
import { enter } from "../../../../src/modules/crossword/play/answer.ts";
import { emptyCells } from "../../../../src/modules/crossword/play/cells.ts";
import { col, row, square, state, word } from "./fixtures.ts";

const BLANK = emptyCells(square());

const entered = (cells: string, slot: number, text: string) => {
  const out = enter(state({ cells }), slot, text);

  if (out.kind !== "entered") throw new Error(`expected an entry, got ${out.kind}`);

  return out;
};

test("a word goes in lowercase, trimmed, unjudged", () => {
  expect(enter(state(), row(0), " CrAtE ")).toEqual({
    kind: "entered",
    cells: `crate${".".repeat(20)}`,
    line: null,
  });
});

test("a down word fills its column and overwrites typed crossings", () => {
  const first = entered(BLANK, row(0), "zzzzz").cells;
  const both = entered(first, col(0), "coups").cells;

  expect([0, 5, 10, 15, 20].map((c) => both[c]).join("")).toBe("coups");
  expect(both.slice(0, 5)).toBe("czzzz");
});

test("a filled slot can be typed again", () => {
  const once = entered(BLANK, row(0), "crate").cells;

  expect(entered(once, row(0), "crane").cells.slice(0, 5)).toBe("crane");
});

test("revealed letters stay; a clash says so", () => {
  const cells = `.R...${".".repeat(20)}`;

  expect(enter(state({ cells }), row(0), "olive")).toEqual({
    kind: "entered",
    cells: `oRive${".".repeat(20)}`,
    line: "🔎 Kept the revealed letters in 1 Across",
  });
  expect(entered(cells, row(0), "crane")).toMatchObject({ line: null });
  expect(entered(cells, row(0), "crane").cells.slice(0, 5)).toBe("cRane");
});

test("non-letters or a wrong length are bad", () => {
  for (const text of ["cran", "cr4ne", "cr-ne", "", "   ", "cranes"]) {
    expect(enter(state(), row(0), text)).toEqual({ kind: "bad", len: 5 });
  }
});

test("typing a full correct grid is still just an entry", () => {
  const cells = [0, 1, 2, 3, 4].reduce((c, n) => entered(c, row(n), word(row(n))).cells, BLANK);

  expect(cells).not.toContain(".");
  expect(enter(state({ cells }), row(0), "crane").kind).toBe("entered");
});

test("a finished round or an unknown clue is stale", () => {
  expect(enter(state({ finished: true }), row(0), "crane")).toEqual({ kind: "stale" });
  expect(enter(state(), 99, "crane")).toEqual({ kind: "stale" });
});

test("`.` or a space blanks a cell; a letter typed as shown stays", () => {
  const cells = `cr...${".".repeat(20)}`;

  expect(entered(cells, row(0), "..ANE").cells.slice(0, 5)).toBe("..ane");
  expect(entered(cells, row(0), "CR.NE").cells.slice(0, 5)).toBe("cr.ne");
  expect(entered(cells, row(0), "c ane").cells.slice(0, 5)).toBe("c.ane");
  expect(entered(cells, row(0), " r   ").cells.slice(0, 5)).toBe(".r...");
});

test("`.` over a revealed letter keeps it without a clash", () => {
  const cells = `.R...${".".repeat(20)}`;

  expect(entered(cells, row(0), "c.ane")).toEqual({
    kind: "entered",
    cells: `cRane${".".repeat(20)}`,
    line: null,
  });
});

test("`.` counts toward the length; other symbols are bad", () => {
  expect(enter(state(), row(0), "....")).toEqual({ kind: "bad", len: 5 });
  expect(enter(state(), row(0), "cr-ne")).toEqual({ kind: "bad", len: 5 });
});
