import { shuffle } from "../../trivia/shuffle.ts";
import type { Pile } from "../types.ts";

export const newPile = <T>(cards: readonly T[], random: () => number): Pile<T> => ({
  draw: shuffle(cards, random),
  discard: [],
});

/** Up to `n` cards; the discards are shuffled back in when the draw pile runs out. */
export function drawCards<T>(pile: Pile<T>, n: number, random: () => number): T[] {
  const out: T[] = [];

  while (out.length < n) {
    if (pile.draw.length === 0) {
      if (pile.discard.length === 0) break;

      pile.draw = shuffle(pile.discard, random);
      pile.discard = [];
    }

    const card = pile.draw.pop();

    if (card !== undefined) out.push(card);
  }

  return out;
}

export function discardCards<T>(pile: Pile<T>, cards: readonly T[]): void {
  pile.discard.push(...cards);
}
