import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../../core/buttons.ts";
import type { Dir } from "../types.ts";
import { cluesId } from "./ids.ts";
import { DIR_NAME } from "./labels.ts";
import { FIRST_MENU, openClues, pageOf } from "./menu.ts";
import { pageClues, type SelectRow } from "./select.ts";
import type { BoardView, Menu } from "./types.ts";

/** Across or Down: the shown direction is primary and disabled; the other opens its first page. */
function dirButton(v: BoardView, shown: Dir, dir: Dir) {
  const style = dir === shown ? ButtonStyle.Primary : ButtonStyle.Secondary;
  const id = cluesId(v.scope, v.stamp, { dir, page: 0 }, "dir");

  return { ...button(id, DIR_NAME[dir], style), disabled: dir === shown };
}

/** ◀, `page/pages` (a label, never clickable) and ▶; an arrow is off at its end. */
function pageButtons(v: BoardView, menu: Menu, pages: number) {
  const to = (page: number, tag: string, label: string) => ({
    ...button(
      cluesId(v.scope, v.stamp, { dir: menu.dir, page }, tag),
      label,
      ButtonStyle.Secondary,
    ),
    disabled: page === menu.page,
  });
  const at = button(
    cluesId(v.scope, v.stamp, menu, "at"),
    `${menu.page + 1}/${pages}`,
    ButtonStyle.Secondary,
  );

  return [
    to(Math.max(0, menu.page - 1), "prev", "◀"),
    { ...at, disabled: true },
    to(Math.min(pages - 1, menu.page + 1), "next", "▶"),
  ];
}

/**
 * A 15×15 board's clue rows: Across / Down with the page buttons, then a select of that page's
 * open clues. Finished, only Across / Down stay, to read both clue lists with their answers.
 */
export function pagedRows(v: BoardView): (Row | SelectRow)[] {
  const menu = v.menu ?? FIRST_MENU;
  const dirs = [dirButton(v, menu.dir, "a"), dirButton(v, menu.dir, "d")];

  if (v.finished) return [row(dirs)];

  const open = pageOf(openClues(v.stored.puzzle, v.cells, menu.dir), menu.page);

  return [row([...dirs, ...pageButtons(v, menu, open.pages)]), pageClues(v, open.items)];
}
