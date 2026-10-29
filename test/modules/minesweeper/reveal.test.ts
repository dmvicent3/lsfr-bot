import { describe, expect, test } from "bun:test";
import { revealAt } from "../../../src/modules/minesweeper/reveal.ts";
import { board } from "./fixtures.ts";

const CORNER_MINE = ["*....", ".....", ".....", ".....", "....."];

describe("revealAt", () => {
  test("a number opens alone", () => {
    const step = revealAt(board(CORNER_MINE), 1);
    expect(step.hit).toBeNull();
    expect(step.hint).toBeNull();
    expect(step.cells.filter((c) => c === "open")).toHaveLength(1);
    expect(step.cells[1]).toBe("open");
  });

  test("a 0 floods every connected safe cell and its numbered border", () => {
    const step = revealAt(board(CORNER_MINE), 24);
    expect(step.cells[0]).toBe("hidden");
    expect(step.cells.slice(1).every((c) => c === "open")).toBe(true);
  });

  test("a flood skips flags", () => {
    const step = revealAt(board(["*....", ".....", "..f..", ".....", "....."]), 24);
    expect(step.cells[12]).toBe("flag");
    expect(step.cells[11]).toBe("open");
  });

  test("a mine is a hit", () => {
    const step = revealAt(board(CORNER_MINE), 0);
    expect(step.hit).toBe(0);
  });

  test("a flagged cell gives a hint and changes nothing", () => {
    const b = board(["*f.", "...", "..."]);
    const step = revealAt(b, 1);
    expect(step.hint).toBe("Flagged — remove the flag to reveal it.");
    expect(step.cells).toEqual(b.cells);
  });

  test("a chord opens the unflagged neighbours when flags match", () => {
    const step = revealAt(board(["F..", "o..", "..."]), 3);
    expect(step.hit).toBeNull();
    expect([1, 4, 6, 7].map((i) => step.cells[i])).toEqual(["open", "open", "open", "open"]);
    expect(step.cells[0]).toBe("flag");
  });

  test("a chord around a wrong flag hits the mine", () => {
    const step = revealAt(board(["*f.", "o..", "..."]), 3);
    expect(step.hit).toBe(0);
  });

  test("a chord without matching flags gives a hint", () => {
    const b = board(["*..", "o..", "..."]);
    const step = revealAt(b, 3);
    expect(step.hint).toBe("Flag 1 neighbour first to open around it.");
    expect(step.cells).toEqual(b.cells);
  });

  test("the hint counts neighbours in the plural", () => {
    expect(revealAt(board(["*.*", ".o.", "*.."]), 4).hint).toBe(
      "Flag 3 neighbours first to open around it.",
    );
  });

  test("an open cell with nothing hidden around it gives a hint", () => {
    expect(revealAt(board(["ooo", "ooo", "ooo"]), 4).hint).toBe("Nothing left to open there.");
    expect(revealAt(board(["Foo", "ooo", "ooo"]), 4).hint).toBe("Nothing left to open there.");
  });
});
