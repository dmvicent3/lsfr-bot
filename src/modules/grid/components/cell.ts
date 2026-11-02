import { tell } from "../../../core/replies.ts";
import type { ComponentHandler } from "../../../core/types.ts";
import { answerModal } from "../render/modal.ts";
import { gridView } from "../render/view.ts";
import { announce } from "./announce.ts";
import { OUT_OF_DATE, type Source, load } from "./guard.ts";
import { boardView, isGame } from "./land.ts";

/** A cell number 0..8 from a custom ID part; null when it is not one. */
export function cellIndex(part: string | undefined): number | null {
  const n = Number(part);

  return part !== undefined && Number.isInteger(n) && n >= 0 && n < 9 ? n : null;
}

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
