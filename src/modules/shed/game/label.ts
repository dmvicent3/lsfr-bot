import type { Card, Colour, Value } from "./types.ts";

const COLOUR_EMOJI: Record<Colour, string> = {
  red: "🟥",
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
};

const NAMES: Partial<Record<Value, string>> = {
  block: "Block",
  turn: "Turn",
  plus2: "+2",
  paint: "Paint",
  paint4: "Paint +4",
};

export const colourEmoji = (c: Colour): string => COLOUR_EMOJI[c];

/** `🟥 7`, `🟦 +2`, `🎨 Paint +4`. */
export const cardLabel = (c: Card): string =>
  `${c.colour ? COLOUR_EMOJI[c.colour] : "🎨"} ${NAMES[c.value] ?? c.value}`;
