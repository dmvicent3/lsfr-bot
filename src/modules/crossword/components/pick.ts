import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { filledSlots, slotText } from "../play/cells.ts";
import { slotIndexOf } from "../render/ids.ts";
import { clueModal } from "../render/modal.ts";
import { STALE, load } from "./guard.ts";
import { refresh } from "./show.ts";

/**
 * `crossword:pick:<date|practice>:<stamp>[:<menu>]`: the answer modal for the chosen clue,
 * prefilled when filled; a paged board's menu rides through the modal back to the board.
 */
export const pickHandler: ComponentHandler = {
  id: "crossword:pick",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return tell(i, STALE);

    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    const { puzzle, clues } = r.where.stored;
    const at = slotIndexOf(puzzle.slots, i.values[0]);

    if (at < 0 || r.rec.finishedAt !== null) return refresh(i, r);

    const slot = puzzle.slots[at]!;
    const value = filledSlots(puzzle, r.rec.cells)[at] ? slotText(r.rec.cells, slot) : undefined;
    const stamp = r.rec.startedAt.toString(36);

    const { scope, menu } = r.where;

    await i.showModal(clueModal({ scope, stamp, slot, clue: clues[at]!, value, menu }));
  },
};
