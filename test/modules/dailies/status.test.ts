import { describe, expect, test } from "bun:test";
import { crosswordEntry } from "../../../src/modules/dailies/status/crossword.ts";
import { duelEntry } from "../../../src/modules/dailies/status/duel.ts";
import { gridEntry } from "../../../src/modules/dailies/status/grid.ts";
import { sudokuEntry } from "../../../src/modules/dailies/status/sudoku.ts";
import { wordEntry } from "../../../src/modules/dailies/status/word.ts";
import { game as crossword } from "../crossword/store/fixtures.ts";
import { game as duel } from "../duel/store/fixtures.ts";
import { game as grid } from "../grid/store/fixtures.ts";
import { game as sudoku } from "../sudoku/store/fixtures.ts";
import { game as word } from "../word/fixtures.ts";

const base = { label: "Game #1", command: "game play", tz: "Europe/Lisbon" };

describe("word", () => {
  test("no game is todo", () => {
    expect(wordEntry(null, base)).toEqual({ ...base, state: "todo", result: null });
  });

  test("an open game is started", () => {
    const g = word("u", "2026-11-03", { won: null, points: null, finishedAt: null });
    expect(wordEntry(g, base).state).toBe("started");
  });

  test("a win shows its points, a loss says lost", () => {
    expect(wordEntry(word("u", "2026-11-03"), base)).toEqual({
      ...base,
      state: "done",
      result: "130 pts",
    });
    expect(wordEntry(word("u", "2026-11-03", { won: false, points: 5 }), base).result).toBe("lost");
  });
});

describe("sudoku", () => {
  test("unsolved is started, solved shows points", () => {
    expect(sudokuEntry(null, base).state).toBe("todo");
    expect(sudokuEntry(sudoku(), base).state).toBe("started");
    expect(sudokuEntry(sudoku({ solvedAt: 2, points: 95 }), base)).toEqual({
      ...base,
      state: "done",
      result: "95 pts",
    });
  });
});

describe("duel", () => {
  test("finished shows right answers and points", () => {
    expect(duelEntry(null, base).state).toBe("todo");
    expect(duelEntry(duel(), base).state).toBe("started");
    expect(duelEntry(duel({ correct: 4, points: 120, finishedAt: 2 }), base).result).toBe(
      "4/5 · 120 pts",
    );
  });
});

describe("grid", () => {
  test("finished shows filled cells and points", () => {
    expect(gridEntry(null, base).state).toBe("todo");
    expect(gridEntry(grid(), base).state).toBe("started");
    expect(gridEntry(grid({ filled: 7, points: 180, finishedAt: 2 }), base).result).toBe(
      "7/9 · 180 pts",
    );
  });
});

describe("crossword", () => {
  test("solved shows points, given up says so", () => {
    expect(crosswordEntry(null, base).state).toBe("todo");
    expect(crosswordEntry(crossword(), base).state).toBe("started");
    expect(
      crosswordEntry(crossword({ solved: true, points: 100, finishedAt: 2 }), base).result,
    ).toBe("100 pts");
    expect(
      crosswordEntry(crossword({ solved: false, points: 0, finishedAt: 2 }), base).result,
    ).toBe("gave up");
  });
});
