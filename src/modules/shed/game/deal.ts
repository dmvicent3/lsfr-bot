import { fullDeck, shuffle } from "./deck.ts";
import { takeCards } from "./draw-pile.ts";
import { beginTurn, nextSeat } from "./order.ts";
import { type Card, type Game, HAND_SIZE } from "./types.ts";

/** The first face-up card: never a Paint +4 (that goes back in at a random place). */
function firstCard(g: Game, random: () => number): Card | undefined {
  let c = g.draw.pop();

  while (c?.value === "paint4") {
    g.draw.splice(Math.floor(random() * (g.draw.length + 1)), 0, c);
    c = g.draw.pop();
  }

  return c;
}

/** Which seat starts, after the first card's effect (it counts as played by nobody). */
function firstSeat(g: Game, c: Card, random: () => number): number {
  const two = g.seats.length === 2;

  if (c.value === "block" || (c.value === "turn" && two)) return nextSeat(g, 0);

  if (c.value === "turn") {
    g.direction = -1;

    return nextSeat(g, 0);
  }

  if (c.value === "plus2") {
    g.seats[0]?.hand.push(...takeCards(g, 2, random));

    return nextSeat(g, 0);
  }

  return 0;
}

/** Turns the first card face up and starts the first turn. */
export function openPile(g: Game, now: number, random: () => number): void {
  const c = firstCard(g, random);

  if (!c) return;

  g.discard = [c];
  g.colour = c.colour;
  beginTurn(g, firstSeat(g, c, random), now);
}

/** Shuffles seats and deck, deals 7 each, turns the first card. */
export function deal(g: Game, now: number, random: () => number): void {
  g.seats = shuffle(g.seats, random);
  g.draw = shuffle(fullDeck(), random);

  for (const s of g.seats) s.hand = takeCards(g, HAND_SIZE, random);

  openPile(g, now, random);
}
