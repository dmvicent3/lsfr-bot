import { MessageFlags } from "discord.js";
import { svgToPng } from "../../core/png.ts";
import { FLEET_FILE, renderFleet, renderGame } from "./render/board.ts";
import type { BoardMessage, GameView } from "./render/types.ts";
import type { Game } from "./types.ts";

/**
 * The board message ready to send, Components V2: the grids drawn into fleet.png.
 * `attachments: []` makes an edit replace the previous picture instead of adding to it; the
 * cleared `content` and `embeds` let an edit turn a board sent before V2 into this one. The
 * player's mention is in the text, so nobody is pinged.
 */
export const boardMessage = (v: GameView) => toMessage(renderGame(v));

/** The "your fleet" message under the board while firing, ready to post; an edit adds `attachments: []`. */
export function fleetMessage(g: Game) {
  const { svg, components } = renderFleet(g);

  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components,
    files: [{ attachment: svgToPng(svg), name: FLEET_FILE }],
    allowedMentions: { parse: [] as [] },
  };
}

function toMessage({ svg, components }: BoardMessage) {
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
