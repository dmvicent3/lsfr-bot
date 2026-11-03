import { svgToPng } from "../../../core/png.ts";
import type { Award, Game } from "../types.ts";
import { boardSvg } from "./board-svg.ts";
import { buttons } from "./buttons.ts";
import { renderStatus } from "./status.ts";

export const BOARD_FILE = "sudoku.png";

/**
 * The game message: the board image, the status line and, on the winning move, the award
 * breakdown. `attachments: []` makes an edit replace the previous image.
 */
export function view(g: Game, now: number, award?: Award | null) {
  const status = renderStatus(g, now);
  const lines = award ? [...award.parts, `**+${award.points} points**`] : [];

  return {
    content: award ? `${status}\n\n${lines.join("\n")}` : status,
    components: buttons(g),
    files: [{ attachment: svgToPng(boardSvg(g)), name: BOARD_FILE }],
    attachments: [] as [],
    allowedMentions: { parse: [] as [] },
  };
}
