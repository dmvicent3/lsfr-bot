import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../../core/buttons.ts";
import { BLOCK, EMPTY_CELL, isRevealed } from "../play/cells.ts";
import { cellId } from "./ids.ts";
import type { BoardView } from "./types.ts";

const LABELS = new Map([
  [EMPTY_CELL, "·"],
  [BLOCK, "■"],
]);

/** A square's label: `·` when empty, `■` on a block, else its letter uppercase. */
export const cellLabel = (ch: string): string => LABELS.get(ch) ?? ch.toUpperCase();

function cellButton(v: BoardView, ch: string, i: number) {
  if (ch === BLOCK) {
    return {
      ...button(cellId(v.scope, v.stamp, i, true), "■", ButtonStyle.Secondary),
      disabled: true,
    };
  }

  const style = isRevealed(ch) ? ButtonStyle.Primary : ButtonStyle.Secondary;

  return button(cellId(v.scope, v.stamp, i), cellLabel(ch), style);
}

/** One button per square, a row per board row; clicking a white one opens its words. */
export function cellRows(v: BoardView): Row[] {
  const { size } = v.stored.puzzle;
  const buttons = v.cells.split("").map((ch, i) => cellButton(v, ch, i));

  return Array.from({ length: size }, (_, r) => row(buttons.slice(r * size, (r + 1) * size)));
}
