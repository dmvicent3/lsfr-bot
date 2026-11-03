import type { ComponentHandler } from "../../../core/types.ts";
import { whiteCellOf } from "../render/ids.ts";
import { cellModal } from "../render/cell-modal.ts";
import { load } from "./guard.ts";
import { refresh } from "./show.ts";

/** `crossword:cell:<date|practice>:<stamp>:<i>`: the modal with the words through a square. */
export const cellHandler: ComponentHandler = {
  id: "crossword:cell",
  async handle(i, args, ctx) {
    const r = load(i, ctx.db, args);

    if (!r || r.stale) return refresh(i, r);

    const { stored } = r.where;
    const cell = whiteCellOf(stored.puzzle, args[2]);

    if (cell === null || r.rec.finishedAt !== null) return refresh(i, r);

    const board = { scope: r.where.scope, stamp: args[1]!, stored, cells: r.rec.cells };

    await i.showModal(cellModal(board, cell));
  },
};
