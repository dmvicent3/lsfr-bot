import type { Game } from "./types.ts";

type Verdict = "play" | "not-yours" | "over";

/** Who may use a board button: `game` is the live game behind the clicked message, if any. */
export function clickVerdict(game: Game | null, c: { userId: string }): Verdict {
  if (!game) return "over";

  return game.playerId === c.userId ? "play" : "not-yours";
}
