import { shuffle } from "./deck.ts";
import type { Card, Game } from "./types.ts";

/** Turns the discard pile, all but its top card, into a fresh draw pile; false when there is none. */
function refill(g: Game, random: () => number): boolean {
  const top = g.discard.at(-1);

  if (!top || g.discard.length <= 1) return false;

  g.draw = shuffle(g.discard.slice(0, -1), random);
  g.discard = [top];

  return true;
}

/** Up to `n` cards from the draw pile, refilled from the discard as needed; fewer when both run dry. */
export function takeCards(g: Game, n: number, random: () => number): Card[] {
  const out: Card[] = [];

  while (out.length < n) {
    if (g.draw.length === 0 && !refill(g, random)) break;

    const c = g.draw.pop();

    if (c) out.push(c);
  }

  return out;
}
