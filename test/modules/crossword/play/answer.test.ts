import { expect, test } from "bun:test";
import { submit } from "../../../../src/modules/crossword/play/answer.ts";
import { emptyCells, isFull, solvedSlots } from "../../../../src/modules/crossword/play/cells.ts";
import { col, row, square, state, word } from "./fixtures.ts";

const BLANK = emptyCells(square());

const hit = (cells: string, slot: number, text = word(slot)): string => {
  const out = submit(state({ cells }), slot, text);

  if (out.kind !== "hit") throw new Error(`expected a hit, got ${out.kind}`);

  return out.cells;
};

test("a right word fills its cells, case-insensitive and trimmed", () => {
  expect(submit(state(), row(0), " CrAnE ")).toEqual({
    kind: "hit",
    cells: "crane" + ".".repeat(20),
    done: false,
  });
});

test("a down word fills its column", () => {
  const cells = hit(BLANK, col(0));

  expect(cells.split("").filter((c) => c !== ".")).toEqual(word(col(0)).split(""));
  expect(cells[0]).toBe("c");
  expect(cells[5]).toBe("o");
});

test("two clues sharing a cell: solving both neither double counts nor overwrites", () => {
  const first = hit(BLANK, row(0));
  const both = hit(first, col(0));

  expect(both.slice(0, 5)).toBe("crane");
  expect(both[5]).toBe("o");
  expect(both.replaceAll(".", "")).toHaveLength(9);
  expect(solvedSlots(square(), both).filter(Boolean)).toHaveLength(2);
});

test("a clue completed by crossing words counts solved, and is solved-already", () => {
  const cells = [0, 1, 2, 3, 4].reduce((c, n) => hit(c, col(n)), BLANK);

  expect(solvedSlots(square(), cells)[row(0)]).toBe(true);
  expect(submit(state({ cells }), row(0), "crane")).toEqual({ kind: "solved-already" });
  expect(submit(state({ cells }), row(0), "x")).toEqual({ kind: "solved-already" });
});

test("non-letters or a wrong length are bad and change nothing", () => {
  for (const text of ["cran", "cr4ne", "cr ne", "", "   ", "cranes"]) {
    expect(submit(state(), row(0), text)).toEqual({ kind: "bad", len: 5 });
  }
});

test("a wrong word costs a mistake and names the clue", () => {
  expect(submit(state({ wrong: 2 }), row(0), "crate")).toEqual({
    kind: "miss",
    line: "❌ 1 Across: not CRATE",
    wrong: 3,
  });
  expect(submit(state(), col(1), "zzzzz")).toMatchObject({ line: "❌ 2 Down: not ZZZZZ" });
});

test("a finished round or an unknown clue is stale", () => {
  expect(submit(state({ finished: true }), row(0), "crane")).toEqual({ kind: "stale" });
  expect(submit(state(), 99, "crane")).toEqual({ kind: "stale" });
});

test("the word that fills the last empty cells reports done", () => {
  const four = [1, 2, 3, 4].reduce((c, n) => hit(c, row(n)), BLANK);

  expect(submit(state({ cells: four }), row(0), "crane")).toMatchObject({
    kind: "hit",
    done: true,
  });
  expect(isFull(four)).toBe(false);
  expect(submit(state({ cells: BLANK }), row(0), "crane")).toMatchObject({ done: false });
});
