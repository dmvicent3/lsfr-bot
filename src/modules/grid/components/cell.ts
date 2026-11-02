import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { isGame } from "../play/round.ts";
import { boardView } from "../render/board-view.ts";
import { answerModal } from "../render/modal.ts";
import { gridView } from "../render/view.ts";
import { announce } from "./announce.ts";
import { cellIndex } from "./ids.ts";
import { OUT_OF_DATE, type Source, load } from "./guard.ts";

/** `grid:cell:<date|practice>:<0-8>`: the answer modal for an empty cell, else the board. */
export const cellHandler = (source: Source): ComponentHandler => ({
  id: "grid:cell",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args[0], source);

    if (!r) return tell(i, OUT_OF_DATE);

    const cell = cellIndex(args[1]);

    if (cell !== null && r.rec.finishedAt === null && r.rec.cells[cell] === "") {
      return i.showModal(answerModal(r.scope, cell, r.grid));
    }

    await i.update(gridView(boardView(r, r.grid, r.rec, r.award), r.snap));

    if (r.award && isGame(r.rec)) await announce(i, r.rec, r.number ?? 0);
  },
});
