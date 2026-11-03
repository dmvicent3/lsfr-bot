import { MessageFlags } from "discord.js";
import { svgToPng } from "../../core/png.ts";
import { FLEET_FILE, renderGame } from "./render/board.ts";
import type { GameView } from "./render/types.ts";

/**
 * The board message ready to send, Components V2: the grids drawn into fleet.png.
 * `attachments: []` makes an edit replace the previous picture instead of adding to it; the
 * cleared `content` and `embeds` let an edit turn a board sent before V2 into this one. The
 * player's mention is in the text, so nobody is pinged.
 */
export function boardMessage(v: GameView) {
  const { svg, components } = renderGame(v);

  return {
    flags: MessageFlags.IsComponentsV2 as const,
    content: null,
    embeds: [] as [],
    components,
    files: [{ attachment: svgToPng(svg), name: FLEET_FILE }],
    attachments: [] as [],
    allowedMentions: { parse: [] as [] },
  };
}
