import { takeCards } from "./draw-pile.ts";
import { active } from "./order.ts";
import type { Game, Seat } from "./types.ts";

/** On one card they didn't call, and still on one card (a forced draw ends it). */
export const canBeCaught = (s: Seat): boolean => s.catchable && s.hand.length === 1;

/** "Catch!": the first player still on one uncalled card, other than the catcher, draws 2. */
export function catchOut(
  g: Game,
  a: { userId: string; random: () => number },
): "caught" | "nobody" | "self" | "not-in" | "over" {
  if (g.phase !== "playing") return "over";

  const me = g.seats.find((s) => s.userId === a.userId);

  if (!me || me.dropped) return "not-in";

  const target = active(g).find((s) => canBeCaught(s) && s !== me);

  if (!target) return canBeCaught(me) ? "self" : "nobody";

  target.hand.push(...takeCards(g, 2, a.random));
  target.catchable = false;
  g.lastMove = `${me.name} caught ${target.name} on one card: +2`;

  return "caught";
}
