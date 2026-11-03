import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { solvedSlots } from "../play/cells.ts";
import { slotIndexOf } from "../render/ids.ts";
import { clueModal } from "../render/modal.ts";
import { STALE, load } from "./guard.ts";
import { refresh } from "./show.ts";

/** `crossword:pick:<date|practice>:<stamp>`: the answer modal for the chosen unsolved clue. */
export const pickHandler: ComponentHandler = {
  id: "crossword:pick",
  async handle(i, args, ctx) {
    if (!i.isStringSelectMenu()) return tell(i, STALE);

    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    const { puzzle, clues } = r.where.stored;
    const at = slotIndexOf(puzzle.slots, i.values[0]);
    const open = at >= 0 && r.rec.finishedAt === null && !solvedSlots(puzzle, r.rec.cells)[at];

    if (!open) return refresh(i, r);

    const stamp = r.rec.startedAt.toString(36);

    await i.showModal(clueModal(r.where.scope, stamp, puzzle.slots[at]!, clues[at]!));
  },
};
