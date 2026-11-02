import type { Snapshot } from "../../../core/countries/types.ts";
import { renderBoard } from "./board.ts";
import { cellButtons, controlRow } from "./buttons.ts";
import { countryNames } from "./names.ts";
import { renderResult } from "./result.ts";
import type { BoardView } from "./types.ts";

/**
 * The game message. In progress: board, 3×3 cell buttons, Give up (and New on a
 * practice grid). Finished: board and result with no cell buttons; a practice
 * grid keeps New. Practice is `number === null`.
 */
export function gridView(v: BoardView, snap: Snapshot) {
  const practice = v.number === null;
  const names = countryNames(snap);
  const board = renderBoard(v);

  return {
    content: v.finished ? `${board}\n\n${renderResult(v, snap)}` : board,
    components: [
      ...cellButtons(v.scope, v.cells, names, v.finished),
      ...controlRow(v.scope, practice, v.finished),
    ],
    allowedMentions: { parse: [] as [] },
  };
}
