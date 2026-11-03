import { tell } from "../../../core/replies.ts";
import type { ModalHandler } from "../../../core/types.ts";
import { answerSlot } from "../play/turn.ts";
import { slotIndexOf } from "../render/ids.ts";
import { load, turnOf } from "./guard.ts";
import { present, refresh } from "./show.ts";

/** `crossword:answer:<date|practice>:<stamp>:<n><a|d>`: judges the typed word for a clue. */
export const answerHandler: ModalHandler = {
  id: "crossword:answer",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    const at = slotIndexOf(r.where.stored.puzzle.slots, args[2]);
    const { outcome, landed } = answerSlot(turnOf(r), at, i.fields.getTextInputValue("word"));

    if (outcome.kind === "bad") {
      return tell(i, `Answers are ${outcome.len} letters, A–Z — no points lost.`);
    }

    await present(i, r, landed ?? { game: r.rec, award: null });
  },
};
