import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../../core/buttons.ts";
import { isFull } from "../play/cells.ts";
import { checkId, giveUpId, newId, revealId } from "./ids.ts";
import type { BoardView } from "./types.ts";

/**
 * Check (enabled once the grid is full), Reveal letter and Give up while playing; New for a
 * practice crossword, also once finished.
 */
export function controlRow(v: BoardView): Row[] {
  const check = button(checkId(v.scope, v.stamp), "Check", ButtonStyle.Primary);
  const play = [
    { ...check, disabled: !isFull(v.cells) },
    button(revealId(v.scope, v.stamp), "Reveal letter", ButtonStyle.Secondary),
    button(giveUpId(v.scope, v.stamp), "Give up", ButtonStyle.Danger),
  ];
  const fresh = button(newId(v.stored.puzzle.size), "New", ButtonStyle.Success);
  const parts = [...(v.finished ? [] : play), ...(v.number === null ? [fresh] : [])];

  return parts.length > 0 ? [row(parts)] : [];
}
