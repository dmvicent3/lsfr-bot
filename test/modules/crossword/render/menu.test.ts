import { describe, expect, test } from "bun:test";
import { emptyCells, fill } from "../../../../src/modules/crossword/play/cells.ts";
import {
  FIRST_MENU,
  isPaged,
  menuFor,
  menuIn,
  menuKey,
  openClues,
  PAGE_SIZE,
  pageCount,
  pageOf,
} from "../../../../src/modules/crossword/render/menu.ts";
import { grid15, square } from "../play/fixtures.ts";

const p = grid15();
const across = p.slots.flatMap((s, i) => (s.dir === "a" ? [i] : []));
const solve = (cells: string, i: number) => fill(cells, p.slots[i]!.cells, p.answers[i]!);

describe("menu key", () => {
  test("round trip through custom id parts", () => {
    expect(menuKey({ dir: "d", page: 1 })).toBe("d1");
    expect(menuIn(["12a", "d1"])).toEqual({ dir: "d", page: 1 });
    expect(menuIn(["a0", "next"])).toEqual(FIRST_MENU);
  });

  test("none: slot keys and tags are not menus", () => {
    expect(menuIn(["12a", "next", "x", ""])).toBeNull();
    expect(menuIn([])).toBeNull();
  });
});

describe("pages", () => {
  test("25 a page, at least one", () => {
    expect(PAGE_SIZE).toBe(25);
    expect([0, 1, 25, 26, 50, 51].map(pageCount)).toEqual([1, 1, 1, 2, 2, 3]);
  });

  test("a page of items, clamped to the ones there are", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);

    expect(pageOf(items, 0)).toEqual({ items: items.slice(0, 25), page: 0, pages: 2 });
    expect(pageOf(items, 1)).toEqual({ items: [25, 26, 27, 28, 29], page: 1, pages: 2 });
    expect(pageOf(items, 7).page).toBe(1);
    expect(pageOf(items, -2).page).toBe(0);
    expect(pageOf([], 3)).toEqual({ items: [], page: 0, pages: 1 });
  });
});

describe("open clues", () => {
  test("the direction's slots in clue order, solved ones dropped", () => {
    const cells = solve(emptyCells(p), across[1]!);

    expect(openClues(p, emptyCells(p), "a")).toEqual(across);
    expect(openClues(p, cells, "a")).toEqual(across.filter((i) => i !== across[1]));
    expect(openClues(p, cells, "d").every((i) => p.slots[i]!.dir === "d")).toBe(true);
  });

  test("a filled but wrong word stays open", () => {
    const i = across[0]!;
    const wrong = fill(emptyCells(p), p.slots[i]!.cells, "z".repeat(p.slots[i]!.cells.length));

    expect(openClues(p, wrong, "a")).toContain(i);
  });
});

describe("menuFor", () => {
  test("only 15×15 is paged", () => {
    expect(([5, 7, 15] as const).map((s) => isPaged(s))).toEqual([false, false, true]);
    expect(menuFor(square(), emptyCells(square()), { dir: "d", page: 1 })).toBeNull();
  });

  test("defaults to Across, page 1; clamps the page when clues drop out", () => {
    expect(menuFor(p, emptyCells(p), undefined)).toEqual(FIRST_MENU);
    expect(menuFor(p, emptyCells(p), { dir: "a", page: 9 })).toEqual({
      dir: "a",
      page: pageCount(across.length) - 1,
    });

    const all = across.reduce(solve, emptyCells(p));

    expect(menuFor(p, all, { dir: "a", page: 1 })).toEqual({ dir: "a", page: 0 });
  });
});
