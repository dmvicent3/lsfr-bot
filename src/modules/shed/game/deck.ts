import type { Card, Colour, Value } from "./types.ts";

export const COLOURS: readonly Colour[] = ["red", "yellow", "green", "blue"];

const TWICE: readonly Value[] = [
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
];

const WILDS = 4;

/** One colour's 25 cards: one 0, two of every other number and action. */
const colourValues = (): Value[] => ["0", ...TWICE, ...TWICE];

/** The 108 cards, ids 0–107. */
export function fullDeck(): Card[] {
  const kinds: { colour: Colour | null; value: Value }[] = [
    ...COLOURS.flatMap((colour) => colourValues().map((value) => ({ colour, value }))),
    ...Array.from({ length: WILDS }, () => ({ colour: null, value: "paint" as const })),
    ...Array.from({ length: WILDS }, () => ({ colour: null, value: "paint4" as const })),
  ];

  return kinds.map((k, id) => ({ id, ...k }));
}

/** A shuffled copy (Fisher–Yates). */
export function shuffle<T>(xs: readonly T[], random: () => number): T[] {
  const out = [...xs];

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i];
    const b = out[j];

    if (a === undefined || b === undefined) continue;

    out[i] = b;
    out[j] = a;
  }

  return out;
}

/** What identical cards share: `red-7`, `x-paint4`. */
export const cardKey = (c: Card): string => `${c.colour ?? "x"}-${c.value}`;

export const isWild = (c: Card): boolean => c.value === "paint" || c.value === "paint4";
