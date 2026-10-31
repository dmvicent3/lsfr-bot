import { COLOURS } from "../game/deck.ts";
import { cardLabel, colourEmoji } from "../game/label.ts";
import type { Card, Game, Value } from "../game/types.ts";

const VALUES: readonly Value[] = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "block",
  "turn",
  "plus2",
  "paint",
  "paint4",
];

const colourRank = (c: Card): number => (c.colour ? COLOURS.indexOf(c.colour) : COLOURS.length);

/** Red, yellow, green, blue, then wilds; numbers before actions within a colour. */
export const sortHand = (hand: Card[]): Card[] =>
  hand.toSorted(
    (a, b) => colourRank(a) - colourRank(b) || VALUES.indexOf(a.value) - VALUES.indexOf(b.value),
  );

export const handText = (hand: Card[]): string =>
  hand.length === 0 ? "no cards" : sortHand(hand).map(cardLabel).join(" · ");

const MEDALS = ["🥇", "🥈", "🥉"];

/** 🥇 🥈 🥉, then 4th, 5th… (8 players at most). */
export const placeLabel = (place: number): string => MEDALS[place - 1] ?? `${place}th`;

/** The face-up card, with the colour a Paint chose: `🎨 Paint → 🟩`. */
export function topLabel(g: Game): string {
  const top = g.discard.at(-1);

  if (!top) return "—";

  const label = cardLabel(top);

  if (top.colour !== null) return label;

  return g.colour ? `${label} → ${colourEmoji(g.colour)}` : `${label} (any colour plays)`;
}

export const arrow = (g: Game): string => (g.direction === 1 ? "⟳" : "⟲");
