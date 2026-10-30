import type { Game, Phase, Player, Round } from "./types.ts";

export type Refusal = "stale" | "closed" | "not-in";

/** The open round, the clicker's seat, or why the click doesn't count. */
export function seat(
  g: Game,
  p: { roundId: string; userId: string; phase: Phase },
): { round: Round; player: Player } | Refusal {
  const round = g.round;

  if (!round || round.id !== p.roundId) return "stale";

  if (g.phase !== p.phase) return "closed";

  const player = g.players.find((x) => x.userId === p.userId);

  return player ? { round, player } : "not-in";
}
