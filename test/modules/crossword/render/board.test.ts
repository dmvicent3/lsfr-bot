import { expect, test } from "bun:test";
import { solutionOf } from "../../../../src/modules/crossword/play/cells.ts";
import { square } from "../play/fixtures.ts";
import { boardText } from "../../../../src/modules/crossword/render/board.ts";
import { bigView, V } from "./fixtures.ts";

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

test("a 7×7 with 90-character clues stays within 2000 characters", () => {
  const out = boardText(bigView());

  expect(out.length).toBeLessThanOrEqual(2000);
  expect(out).toContain("…");
});

test("a finished 7×7 with answers also fits, deterministically", () => {
  const v = bigView({ finished: true, award: { points: 80, parts: ["Solved: 100"] } });
  const out = boardText(v);

  expect(out.length).toBeLessThanOrEqual(2000);
  expect(boardText(v)).toBe(out);
});

test("short clues are never cut", () => {
  expect(boardText(V)).not.toContain("…");
});
