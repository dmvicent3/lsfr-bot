import { expect, test } from "bun:test";
import { renderStatus } from "../../../../src/modules/sudoku/render/status.ts";
import { EASY, EASY_SOLUTION } from "../fixtures.ts";
import { GAME } from "./game.ts";

const MIN = 60_000;
const left = EASY.split("").filter((c) => c === "0").length;
const G = { ...GAME, checks: 1, startedAt: 1000 };

test("daily: level, puzzle number, elapsed, checks and cells left", () => {
  expect(renderStatus(G, 1000 + 4 * MIN + 12_000)).toBe(
    `Easy · #3 · 4m 12s · 1 check · ${left} left`,
  );
});

test("practice has no number and checks are pluralised", () => {
  const g = { ...G, kind: "practice" as const, checks: 0, level: "medium" as const };
  expect(renderStatus(g, 1000 + 5000)).toBe(`Practice · Medium · 5s · 0 checks · ${left} left`);
});

test("solved shows the final time instead of elapsed and left", () => {
  const g = { ...G, cells: EASY_SOLUTION, solvedAt: 1000 + 23 * MIN + 10_000 };
  expect(renderStatus(g, 9_999_999_999)).toBe("Easy · #3 · Solved in 23m 10s · 1 check");
});

test("solved practice", () => {
  const g = { ...G, kind: "practice" as const, solvedAt: 1000 + 61_000 };
  expect(renderStatus(g, 0)).toBe("Practice · Easy · Solved in 1m 1s · 1 check");
});

test("solved daily with points appends them", () => {
  const g = { ...G, cells: EASY_SOLUTION, solvedAt: 1000 + 23 * MIN + 10_000, points: 120 };
  expect(renderStatus(g, 0)).toBe("Easy · #3 · Solved in 23m 10s · 1 check · 120 pts");
});

test("solved practice never shows points", () => {
  const g = { ...G, kind: "practice" as const, solvedAt: 1000 + 61_000, points: 50 };
  expect(renderStatus(g, 0)).toBe("Practice · Easy · Solved in 1m 1s · 1 check");
});
