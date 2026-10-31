import { ownGrid } from "./grid.ts";
import { resultLine, yourAfloat } from "./lines.ts";
import { EMBED_COLOR, TITLE, players } from "./board.ts";
import type { BoardMessage, GameView } from "./types.ts";

/** The "Your fleet" message under the board: the player's grid with jevos's shots on it. */
export function renderFleet(v: GameView): BoardMessage {
  const end = v.outcome.kind === "playing" ? [] : [resultLine(v.game, v.outcome)];
  const lines = [players(v.game), "", ownGrid(v.game, false), "", yourAfloat(v.game), ...end];

  return {
    embeds: [{ title: `${TITLE} — your fleet`, color: EMBED_COLOR, description: lines.join("\n") }],
    components: [],
  };
}
