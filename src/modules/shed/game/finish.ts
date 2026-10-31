import { active } from "./order.ts";
import type { Game } from "./types.ts";

/** Places anyone whose hand is empty; with one player (or none) left holding cards, the game ends. */
export function settle(g: Game): void {
  for (const s of active(g)) if (s.hand.length === 0) s.place = g.nextPlace++;

  const left = active(g);

  if (left.length > 1) return;

  for (const s of left) s.place = g.nextPlace++;

  g.phase = "over";
  g.endReason = "done";
  g.pending = null;
}
