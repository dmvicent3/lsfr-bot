import { solvedSlots } from "../play/cells.ts";
import type { Dir, Puzzle, Size } from "../types.ts";
import type { Menu } from "./types.ts";

/** Discord's most options in one select. */
export const PAGE_SIZE = 25;

export const FIRST_MENU: Menu = { dir: "a", page: 0 };

/** Boards with too many clues for one select pick them by direction and page. */
export const isPaged = (size: Size): boolean => size === 15;

/** `a0` / `d1`: a menu as a custom id part. */
export const menuKey = (m: Menu): string => `${m.dir}${m.page}`;

const MENU_PART = /^([ad])(\d{1,3})$/;

/** The menu in the custom id parts after scope and stamp; null when none is there. */
export function menuIn(parts: string[]): Menu | null {
  for (const part of parts) {
    const m = MENU_PART.exec(part);

    if (m) return { dir: m[1] === "d" ? "d" : "a", page: Number(m[2]) };
  }

  return null;
}

/** The indices of the direction's slots not yet solved, in clue order. */
export function openClues(p: Puzzle, cells: string, dir: Dir): number[] {
  const solved = solvedSlots(p, cells);

  return p.slots.flatMap((s, i) => (s.dir === dir && !solved[i] ? [i] : []));
}

/** How many pages `count` items take; one even when there are none. */
export const pageCount = (count: number): number => Math.max(1, Math.ceil(count / PAGE_SIZE));

/** One page of items, the page clamped to the ones there are. */
export function pageOf<T>(items: T[], page: number): { items: T[]; page: number; pages: number } {
  const pages = pageCount(items.length);
  const at = Math.min(Math.max(0, page), pages - 1);

  return { items: items.slice(at * PAGE_SIZE, (at + 1) * PAGE_SIZE), page: at, pages };
}

/** A paged board's menu, its page clamped to the open clues left; null on smaller boards. */
export function menuFor(p: Puzzle, cells: string, menu: Menu | null | undefined): Menu | null {
  if (!isPaged(p.size)) return null;

  const { dir, page } = menu ?? FIRST_MENU;

  return { dir, page: pageOf(openClues(p, cells, dir), page).page };
}
