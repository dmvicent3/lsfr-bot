import type { Click, ClickVerdict, Game } from "./types.ts";

/** Who may use a board button: only the player, and only on the live game's message. */
export function clickVerdict(game: Game | null, c: Click): ClickVerdict {
  if (!game || game.messageId !== c.messageId) return "over";

  return game.playerId === c.userId ? "play" : "not-yours";
}
