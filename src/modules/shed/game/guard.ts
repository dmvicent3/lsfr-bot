import type { Act, Game, Refusal } from "./types.ts";

/** The clicking player's seat when it is their live turn; otherwise why the click is refused. */
export function turnSeat(g: Game, a: Pick<Act, "userId" | "turnNo">): number | Refusal {
  if (g.phase !== "playing") return "over";

  const i = g.seats.findIndex((s) => s.userId === a.userId);
  const s = g.seats[i];

  if (!s || s.place !== null || s.dropped) return "not-in";

  if (i !== g.turn) return "not-your-turn";

  return a.turnNo === g.turnNo ? i : "stale";
}
