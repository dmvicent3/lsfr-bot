import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { slotsThrough } from "../play/through.ts";
import { answerCell } from "../play/turn.ts";
import { slotKey, whiteCellOf } from "../render/ids.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/**
 * `crossword:cellword:<date|practice>:<stamp>:<i>`: writes the words typed for a square's slots,
 * unjudged; `.` blanks a cell, an empty input skips its slot.
 */
export const cellWordHandler: ModalHandler = {
  id: "crossword:cellword",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    const { puzzle } = r.where.stored;
    const cell = whiteCellOf(puzzle, args[2]);

    if (cell === null) return refresh(i, r);

    const typed = slotsThrough(puzzle, cell).map((slot) => ({
      slot,
      text: i.fields.getTextInputValue(slotKey(puzzle.slots[slot]!)),
    }));
    const { entry, landed } = answerCell(turnOf(r), typed);

    if (entry.kind === "bad") {
      return tell(
        i,
        `Use ${entry.len} letters A–Z, . or a space to blank a square — no points lost.`,
      );
    }

    await present(i, r, landed ?? { game: r.rec, award: null });
  },
};
