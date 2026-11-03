import type { Row } from "../../../core/buttons.ts";
import { boardText } from "./board.ts";
import { controlRow } from "./buttons.ts";
import { gridSvg } from "./grid-svg.ts";
import { svgToPng } from "../../../core/png.ts";
import { clueSelect, type SelectRow } from "./select.ts";
import type { BoardView } from "./types.ts";

export const GRID_FILE = "crossword.png";

/**
 * The game message: board text, the grid image and, while playing, the clue select with the
 * controls. `attachments: []` makes an edit replace the previous image.
 */
export function crosswordView(v: BoardView) {
  const select = v.finished ? [] : [clueSelect(v)];
  const components: (Row | SelectRow)[] = [...select, ...controlRow(v)];
  const png = svgToPng(gridSvg(v.stored.puzzle, v.cells, v.finished));

  return {
    content: boardText(v),
    components,
    files: [{ attachment: png, name: GRID_FILE }],
    attachments: [] as [],
    allowedMentions: { parse: [] as [] },
  };
}
