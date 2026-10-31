import { ButtonStyle } from "discord.js";
import { COLOURS, cardKey } from "../game/deck.ts";
import { cardLabel, colourEmoji } from "../game/label.ts";
import { isLegal } from "../game/legal.ts";
import type { Card, Game, Seat } from "../game/types.ts";
import { type Button, button } from "./parts.ts";
import { sortHand } from "./text.ts";

const LAST = " + Last card!";

/** One play of `count` copies; called "+ Last card!" when it leaves exactly one. */
function playButton(g: Game, s: Seat, c: Card, count: number): Button {
  const last = s.hand.length - count === 1;
  const times = count > 1 ? ` ×${count}` : "";
  const id = `shed:play:${g.turnNo}:${cardKey(c)}:${count}:${last ? 1 : 0}`;

  return button(id, `${cardLabel(c)}${times}${last ? LAST : ""}`);
}

/** A button per distinct legal card, plus the ×k form when stacking is on and k > 1 are held. */
export function playButtons(g: Game, s: Seat): Button[] {
  const top = g.discard.at(-1);
  const seen = new Set<string>();
  const out: Button[] = [];

  for (const c of sortHand(s.hand)) {
    const key = cardKey(c);

    if (seen.has(key) || !top || !isLegal(c, top, g.colour, g.pending)) continue;

    seen.add(key);
    const k = s.hand.filter((x) => cardKey(x) === key).length;
    out.push(playButton(g, s, c, 1));

    if (g.stacking && k > 1) out.push(playButton(g, s, c, k));
  }

  return out;
}

export const drawButton = (g: Game): Button =>
  button(
    `shed:draw:${g.turnNo}`,
    g.pending ? `Take ${g.pending.total}` : "Draw",
    ButtonStyle.Primary,
  );

/** After a draw that plays: Play it (called when it leaves one) or Pass. */
export function drawnButtons(g: Game, s: Seat): Button[] {
  const last = s.hand.length === 2;
  const label = `Play it${g.drawn ? ` (${cardLabel(g.drawn)})` : ""}${last ? LAST : ""}`;

  return [
    button(`shed:keep:${g.turnNo}:${last ? 1 : 0}`, label, ButtonStyle.Success),
    button(`shed:pass:${g.turnNo}`, "Pass"),
  ];
}

export const paintButtons = (g: Game): Button[] =>
  COLOURS.map((c) => button(`shed:paint:${g.turnNo}:${c}`, `${colourEmoji(c)} ${c}`));
