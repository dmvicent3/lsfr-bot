import { takeCards } from "./draw-pile.ts";
import { active } from "./order.ts";
import type { Game } from "./types.ts";

/** "Catch!": the first player still on one uncalled card, other than the catcher, draws 2. */
export function catchOut(
  g: Game,
  a: { userId: string; random: () => number },
): "caught" | "nobody" | "self" | "not-in" | "over" {
  if (g.phase !== "playing") return "over";

  const me = g.seats.find((s) => s.userId === a.userId);

  if (!me || me.dropped) return "not-in";

  const target = active(g).find((s) => s.catchable && s !== me);

  if (!target) return me.catchable ? "self" : "nobody";

  target.hand.push(...takeCards(g, 2, a.random));
  target.catchable = false;
  g.lastMove = `${me.name} caught ${target.name} on one card: +2`;

  return "caught";
}
