import { type Refusal, seat } from "./guard.ts";
import type { Game } from "./types.ts";

/** A vote for the answer shown at `index`; it can be changed, never for your own card. */
export function castVote(
  g: Game,
  c: { roundId: string; userId: string; index: number },
): "voted" | "changed" | "own" | Refusal {
  const s = seat(g, { ...c, phase: "voting" });

  if (typeof s === "string") return s;

  const author = s.round.order[c.index];

  if (author === undefined) return "stale";

  if (author === c.userId) return "own";

  const before = s.round.votes.get(c.userId);
  s.round.votes.set(c.userId, author);

  return before === undefined ? "voted" : "changed";
}

export const allVoted = (g: Game): boolean => g.players.every((p) => g.round?.votes.has(p.userId));
