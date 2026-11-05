import {
  type APIMediaGalleryComponent,
  type APIMessageTopLevelComponent,
  type APITextDisplayComponent,
  ComponentType,
  MessageFlags,
} from "discord.js";
import type { Row } from "../../../core/buttons.ts";
import { svgToPng } from "../../../core/png.ts";
import { boardText } from "./board.ts";
import { controlRow } from "./buttons.ts";
import { cellRows } from "./cell-buttons.ts";
import { gridSvg } from "./grid-svg.ts";
import { pagedRows } from "./paged.ts";
import { allClues, type SelectRow } from "./select.ts";
import type { Size } from "../types.ts";
import type { BoardView } from "./types.ts";

export const GRID_FILE = "crossword.png";

const text = (content: string): APITextDisplayComponent => ({
  type: ComponentType.TextDisplay,
  content,
});

const gallery: APIMediaGalleryComponent = {
  type: ComponentType.MediaGallery,
  items: [{ media: { url: `attachment://${GRID_FILE}` } }],
};

/**
 * How a size is played: a button per square on 5×5, the clue select on 7×7 (49 won't fit), the
 * paged clue select on 15×15 (85 clues won't fit one select).
 */
const PLAY_ROWS: Record<Size, (v: BoardView) => (Row | SelectRow)[]> = {
  5: (v) => (v.finished ? [] : cellRows(v)),
  7: (v) => (v.finished ? [] : [allClues(v)]),
  15: pagedRows,
};

/**
 * The game message, Components V2: header, the grid image, the clues and result and, while
 * playing, the squares (or clue select) with the controls. `attachments: []` makes an edit replace
 * the previous image.
 */
export function crosswordView(v: BoardView) {
  const { header, body } = boardText(v);
  const play = PLAY_ROWS[v.stored.puzzle.size](v);
  const components: APIMessageTopLevelComponent[] = [
    text(header),
    gallery,
    text(body),
    ...play,
    ...controlRow(v),
  ];
  const png = svgToPng(gridSvg(v.stored.puzzle, v.cells, v.finished));

  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components,
    files: [{ attachment: png, name: GRID_FILE }],
    attachments: [] as [],
    allowedMentions: { parse: [] as [] },
  };
}
