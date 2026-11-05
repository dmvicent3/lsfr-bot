import { type APITextDisplayComponent, ComponentType, MessageFlags } from "discord.js";
import { boardText, header } from "./board.ts";
import { controlRow } from "./buttons.ts";
import type { BoardView } from "./types.ts";

const text = (content: string): APITextDisplayComponent => ({
  type: ComponentType.TextDisplay,
  content,
});

/**
 * The game message, Components V2 (boards already sent carry the flag, which an edit cannot drop):
 * the header, the emoji rows and the text under them, then the buttons. `attachments: []` makes an
 * edit of an older board drop its picture.
 */
export function snakeView(v: BoardView) {
  const under = boardText(v);

  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components: [text(header(v)), ...(under ? [text(under)] : []), ...controlRow(v)],
    attachments: [] as [],
    allowedMentions: { parse: [] as [] },
  };
}
