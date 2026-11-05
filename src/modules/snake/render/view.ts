import {
  type APIMessageTopLevelComponent,
  type APITextDisplayComponent,
  ComponentType,
  MessageFlags,
} from "discord.js";
import { svgToPng } from "../../../core/png.ts";
import { body, header } from "./board.ts";
import { boardSvg } from "./board-svg.ts";
import { controlRow } from "./buttons.ts";
import { boardLines } from "./lines.ts";
import type { BoardView } from "./types.ts";

export const BOARD_FILE = "snake.png";

const text = (content: string): APITextDisplayComponent => ({
  type: ComponentType.TextDisplay,
  content,
});

const gallery: APIMessageTopLevelComponent = {
  type: ComponentType.MediaGallery,
  items: [{ media: { url: `attachment://${BOARD_FILE}` } }],
};

/** The picture and the text under it; no picture before the first guess. */
function parts(v: BoardView) {
  const { lines, earlier } = boardLines(v.guesses, v.answer);
  const under = body(v, earlier);
  const after = under ? [text(under)] : [];

  if (lines.length === 0) return { components: after, files: [] };

  const png = svgToPng(boardSvg(lines));

  return { components: [gallery, ...after], files: [{ attachment: png, name: BOARD_FILE }] };
}

/**
 * The game message, Components V2: header, the guesses picture, the text under it and the
 * buttons. `attachments: []` makes an edit replace the previous picture.
 */
export function snakeView(v: BoardView) {
  const { components, files } = parts(v);

  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components: [text(header(v)), ...components, ...controlRow(v)],
    files,
    attachments: [] as [],
    allowedMentions: { parse: [] as [] },
  };
}
