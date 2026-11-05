import { describe, expect, test } from "bun:test";
import { solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { fill } from "../../../../src/modules/crossword/play/cells.ts";
import { square } from "../play/fixtures.ts";
import { boardText as parts } from "../../../../src/modules/crossword/render/board.ts";
import type { BoardView } from "../../../../src/modules/crossword/render/types.ts";
import { big15View, bigView, V } from "./fixtures.ts";

const SHAPE = [
  "Crossword #3 · Words 1/10 · 95 pts · 2:14",
  "**Across**",
  "1. clue 1a (5)",
  "6. clue 6a (5)",
  "7. clue 7a (5)",
  "8. clue 8a (5)",
  "9. clue 9a (5)",
  "**Down**",
  "1. clue 1d (5)",
  "2. clue 2d (5)",
  "3. clue 3d (5)",
  "4. clue 4d (5)",
  "5. clue 5d (5)",
].join("\n");

const FULL = solutionOf(square());

/** Header and body as the two text displays read, one after the other. */
const boardText = (v: BoardView): string => {
  const { header, body } = parts(v);

  return `${header}\n${body}`;
};

test("the header is its own line; the body starts with the across list", () => {
  const { header, body } = parts(V);

  expect(header).toBe("Crossword #3 · Words 1/10 · 95 pts · 2:14");
  expect(body).toStartWith("**Across**\n");
});

test("daily in progress: header and clue lists, no grid text", () => {
  expect(boardText(V)).toBe(SHAPE);
});

test("Words counts filled slots, right or wrong", () => {
  expect(boardText({ ...V, cells: `zzzzz${"z".repeat(5)}${".".repeat(15)}` })).toStartWith(
    "Crossword #3 · Words 2/10 ·",
  );
});

test("last-action line follows the lists", () => {
  const out = boardText({ ...V, lastLine: "❌ Not quite — some letters are wrong (−10)" });

  expect(out).toBe(`${SHAPE}\n❌ Not quite — some letters are wrong (−10)`);
});

test("practice header", () => {
  const head = boardText({ ...V, number: null, scope: "practice" }).split("\n")[0];

  expect(head).toBe("Practice crossword 5×5 · Words 1/10 · 2:14");
});

test("finished daily: answers, award, next", () => {
  const out = boardText({
    ...V,
    cells: FULL,
    finished: true,
    solved: true,
    points: 90,
    award: { points: 90, parts: ["Solved: 100", "Wrong checks: −10", "Streak 3: +10"] },
    untilNext: "5h 2m",
  });

  expect(out).not.toContain("```");
  expect(out).toContain("\n1. clue 1a — CRANE\n");
  expect(out).toContain("Streak 3: +10\n**90 points**");
  expect(out.endsWith("\n\nNext crossword in 5h 2m")).toBe(true);
});

test("finished daily gave up, even on a full grid: zero points", () => {
  const out = boardText({ ...V, cells: FULL, finished: true, points: 0 });

  expect(out).toContain("Gave up — 0 points");
});

test("finished practice shows wrong checks and reveals, no next line", () => {
  const out = boardText({
    ...V,
    number: null,
    finished: true,
    solved: true,
    cells: FULL,
    wrong: 2,
    reveals: 1,
    untilNext: "1h",
  });

  expect(out).toContain("Solved!\nWrong checks: 2 · Reveals: 1");
  expect(out).not.toContain("Next crossword");
});

test("a 7×7 with 90-character clues stays within the 4000-character text budget", () => {
  const out = boardText(bigView());

  expect(out.length).toBeLessThanOrEqual(4000);
  expect(out).not.toContain("…");
});

test("past the budget every clue is cut to the same, longest fitting length", () => {
  const out = boardText(bigView({ lastLine: "z".repeat(2500) }));
  const cut = out.split("\n").filter((l) => l.includes("…"));

  expect(out.length).toBeLessThanOrEqual(4000);
  expect(cut).toHaveLength(22);
  expect(new Set(cut.map((l) => l.replace(/^\d+\. /, "").length)).size).toBeLessThanOrEqual(2);
});

test("a finished 7×7 with answers also fits, deterministically", () => {
  const v = bigView({ finished: true, award: { points: 80, parts: ["Solved: 100"] } });
  const out = boardText(v);

  expect(out.length).toBeLessThanOrEqual(4000);
  expect(boardText(v)).toBe(out);
});

test("short clues are never cut", () => {
  expect(boardText(V)).not.toContain("…");
});

describe("15×15", () => {
  const B = big15View();
  const { puzzle } = B.stored;

  test("lists only the direction its menu shows", () => {
    const across = boardText(B);
    const down = boardText(big15View({ menu: { dir: "d", page: 1 } }));

    expect(across).toContain("**Across**");
    expect(across).not.toContain("**Down**");
    expect(down).toContain("**Down**");
    expect(down).not.toContain("**Across**");
  });

  test("a solved clue is struck through; a wrong one is not", () => {
    const [first, second] = puzzle.slots.flatMap((s, i) => (s.dir === "a" ? [i] : []));
    const right = fill(B.cells, puzzle.slots[first!]!.cells, puzzle.answers[first!]!);
    const cells = fill(right, puzzle.slots[second!]!.cells, "z".repeat(7));
    const lines = parts({ ...B, cells }).body.split("\n");

    expect(lines[1]).toStartWith(`~~${puzzle.slots[first!]!.n}. `);
    expect(lines[1]).toEndWith("~~");
    expect(lines[2]).not.toContain("~~");
  });

  test("the longest direction with 90-character clues fits, cut evenly and kept readable", () => {
    const solvedHalf = puzzle.slots.reduce(
      (c, s, i) => (i % 2 ? fill(c, s.cells, puzzle.answers[i]!) : c),
      B.cells,
    );

    for (const v of [
      B,
      big15View({ menu: { dir: "d", page: 0 } }),
      { ...B, cells: solvedHalf, lastLine: "❌ Not quite — some letters are wrong" },
      big15View({ finished: true, award: { points: 0, parts: [] } }),
    ]) {
      const { header, body } = parts(v);
      const clue = body.split("\n").filter((l) => /^(~~)?\d+\. /.test(l));

      expect(header.length + body.length).toBeLessThanOrEqual(4000);
      expect(clue.length).toBeGreaterThanOrEqual(43);
      expect(Math.min(...clue.map((l) => l.length))).toBeGreaterThanOrEqual(60);
    }
  });
});
