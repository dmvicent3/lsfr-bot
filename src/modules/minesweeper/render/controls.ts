import { colOf, columnLetter, rowOf } from "../grid.ts";
import type { Controls, Game } from "../types.ts";
import { FLAG, GIVE_UP, REVEAL, type Row, arrow, blank, menu, options, row } from "./parts.ts";

function menus(game: Game): Row[] {
  const col = colOf(game.cursor, game.width);
  const r = rowOf(game.cursor, game.width);

  return [
    menu("minesweeper:col", "Column", options(game.width, col, columnLetter)),
    menu(
      "minesweeper:row",
      "Row",
      options(game.height, r, (n) => String(n + 1)),
    ),
  ];
}

const actions = (): Row => row([REVEAL, FLAG, GIVE_UP]);

/** A 3×3 game pad: arrows around Reveal, Flag and Give up in the top corners. */
const pad = (game: Game): Row[] => [
  row([FLAG, arrow(game, "up"), GIVE_UP]),
  row([arrow(game, "left"), REVEAL, arrow(game, "right")]),
  row([blank(1), arrow(game, "down"), blank(2)]),
];

const arrowRow = (game: Game): Row =>
  row([arrow(game, "left"), arrow(game, "up"), arrow(game, "down"), arrow(game, "right")]);

const LAYOUTS: Record<Controls, (game: Game) => Row[]> = {
  menus: (game) => [...menus(game), actions()],
  arrows: pad,
  both: (game) => [...menus(game), arrowRow(game), actions()],
};

/** The board's controls in the game's chosen layout. */
export const controls = (game: Game): Row[] => LAYOUTS[game.controls](game);
