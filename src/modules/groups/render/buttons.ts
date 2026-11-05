import { ButtonStyle } from "discord.js";
import { button, type Row, row } from "../../../core/buttons.ts";
import { GROUP_SIZE } from "../generate/pick.ts";
import { fromHex } from "../play/hex.ts";
import { unsolved, wordOf } from "../play/words.ts";
import { NEW_ID, clearId, giveUpId, pickId, shuffleId, submitId } from "./ids.ts";
import type { BoardView } from "./types.ts";

/** The words still on the board, four to a row; selected ones stand out. */
export function wordRows(v: BoardView): Row[] {
  if (v.finished) return [];

  const picked = new Set(fromHex(v.progress.picked));
  const buttons = unsolved(v.progress.order, v.progress.found).map((w) => {
    const style = picked.has(w) ? ButtonStyle.Primary : ButtonStyle.Secondary;

    return button(pickId(v.scope, v.stamp, w), wordOf(v.puzzle, w).toUpperCase(), style);
  });

  return Array.from({ length: Math.ceil(buttons.length / GROUP_SIZE) }, (_, r) =>
    row(buttons.slice(r * GROUP_SIZE, (r + 1) * GROUP_SIZE)),
  );
}

/** Submit (n/4), enabled at four; Shuffle, Clear, Give up while playing. */
function playButtons(v: BoardView) {
  const count = v.progress.picked.length;
  const submit = button(submitId(v.scope, v.stamp), `Submit (${count}/4)`, ButtonStyle.Success);
  const clear = button(clearId(v.scope, v.stamp), "Clear", ButtonStyle.Secondary);

  return [
    { ...submit, disabled: count !== GROUP_SIZE },
    button(shuffleId(v.scope, v.stamp), "Shuffle", ButtonStyle.Secondary),
    { ...clear, disabled: count === 0 },
    button(giveUpId(v.scope, v.stamp), "Give up", ButtonStyle.Danger),
  ];
}

/** The controls while playing; practice adds New, also once finished. */
export function controlRow(v: BoardView): Row[] {
  const fresh = button(NEW_ID, "New", ButtonStyle.Primary);
  const parts = [...(v.finished ? [] : playButtons(v)), ...(v.number === null ? [fresh] : [])];

  return parts.length > 0 ? [row(parts)] : [];
}
