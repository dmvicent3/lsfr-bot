import { expect, test } from "bun:test";
import { emptyCells } from "../../../../src/modules/crossword/play/cells.ts";
import { enterWords } from "../../../../src/modules/crossword/play/words.ts";
import { col, row, square, state } from "./fixtures.ts";

const BLANK = emptyCells(square());
const column = (cells: string, c: number) => [0, 1, 2, 3, 4].map((r) => cells[r * 5 + c]).join("");

test("both words go in, across first, down wins the shared cell", () => {
  const out = enterWords(state(), [
    { slot: row(0), text: " crane " },
    { slot: col(0), text: "Zoups" },
  ]);

  expect(out.kind).toBe("entered");

  if (out.kind !== "entered") return;

  expect(out.cells.slice(0, 5)).toBe("zrane");
  expect(column(out.cells, 0)).toBe("zoups");
  expect(out.line).toBeNull();
});

test("an empty input skips its slot; `.` blanks cells", () => {
  const cells = `crane${".".repeat(20)}`;
  const out = enterWords(state({ cells }), [
    { slot: row(0), text: "   " },
    { slot: col(0), text: ".OUPS" },
  ]);

  expect(out).toEqual({
    kind: "entered",
    cells: ".raneo....u....p....s....",
    line: null,
  });
});

test("a square's other word, left as shown, doesn't undo this one's edit", () => {
  const cells = `crane${".".repeat(20)}`;
  const typed = (across: string, down: string) =>
    enterWords(state({ cells }), [
      { slot: row(0), text: across },
      { slot: col(0), text: down },
    ]);

  // The modal showed CRANE and C.... ; one word changes the shared C, the other leaves it.
  expect(typed(".RANE", "C....")).toMatchObject({ cells: `.rane${".".repeat(20)}` });
  expect(typed("CRANE", "Z....")).toMatchObject({ cells: `zrane${".".repeat(20)}` });
  expect(typed("BRANE", "C....")).toMatchObject({ cells: `brane${".".repeat(20)}` });
});

test("nothing typed stores the cells unchanged and clears the line", () => {
  expect(enterWords(state({ cells: BLANK }), [{ slot: row(0), text: "" }])).toEqual({
    kind: "entered",
    cells: BLANK,
    line: null,
  });
});

test("any invalid input is bad, with its slot's length", () => {
  expect(
    enterWords(state(), [
      { slot: row(0), text: "crane" },
      { slot: col(0), text: "cr4ne" },
    ]),
  ).toEqual({ kind: "bad", len: 5 });
});

test("revealed letters stay and every clashing slot is named", () => {
  const cells = `R....${".".repeat(20)}`;

  expect(
    enterWords(state({ cells }), [
      { slot: row(0), text: "crane" },
      { slot: col(0), text: "coups" },
    ]),
  ).toMatchObject({ kind: "entered", line: "🔎 Kept the revealed letters in 1 Across and 1 Down" });
});

test("a finished round is stale", () => {
  expect(enterWords(state({ finished: true }), [{ slot: row(0), text: "crane" }])).toEqual({
    kind: "stale",
  });
});
