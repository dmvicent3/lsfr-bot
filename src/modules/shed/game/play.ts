import { cardKey } from "./deck.ts";
import { applyPlay } from "./effects.ts";
import { turnSeat } from "./guard.ts";
import { isLegal } from "./legal.ts";
import type { Act, Card, Game, Refusal } from "./types.ts";

export type PlayResult =
  | "played"
  | "pick-colour"
  | Refusal
  | "illegal"
  | "not-held"
  | "no-stacking";

export interface PlayAct extends Act {
  key: string;
  count: number;
  /** "+ Last card!" pressed with the play. */
  last: boolean;
}

/** The `count` held cards matching `key`, or why they can't be played. */
function chosen(g: Game, hand: Card[], a: PlayAct): Card[] | "illegal" | "not-held" {
  const held = hand.filter((c) => cardKey(c) === a.key);
  const first = held[0];
  const top = g.discard.at(-1);

  if (!first || a.count < 1 || held.length < a.count) return "not-held";

  if (!top || !isLegal(first, top, g.colour, g.pending)) return "illegal";

  return held.slice(0, a.count);
}

/** Plays one card, or several identical ones (stacking on), on the player's own turn. */
export function playCards(g: Game, a: PlayAct): PlayResult {
  const seat = turnSeat(g, a);

  if (typeof seat === "string") return seat;

  const s = g.seats[seat];

  if (!s || g.step !== "play") return "illegal";

  if (a.count > 1 && !g.stacking) return "no-stacking";

  const cards = chosen(g, s.hand, a);

  if (typeof cards === "string") return cards;

  const ids = new Set(cards.map((c) => c.id));
  s.hand = s.hand.filter((c) => !ids.has(c.id));

  return applyPlay(g, seat, cards, a);
}
