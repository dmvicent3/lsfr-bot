import { svgToPng } from "../../core/png.ts";
import { FLEET_FILE, renderGame } from "./render/board.ts";
import type { GameView } from "./render/types.ts";

/**
 * The board message ready to send: the grids drawn into fleet.png. `attachments: []` makes an
 * edit replace the previous picture instead of adding to it.
 */
export function boardMessage(v: GameView) {
  const { svg, ...board } = renderGame(v);

  return {
    ...board,
    files: [{ attachment: svgToPng(svg), name: FLEET_FILE }],
    attachments: [] as [],
  };
}
