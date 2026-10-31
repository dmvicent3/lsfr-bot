import type { Game, Seat } from "../game/types.ts";
import { drawButton, drawnButtons, paintButtons, playButtons } from "./hand-buttons.ts";
import { type Button, type ButtonRow, button, nameAt, rows } from "./parts.ts";
import { handText, topLabel } from "./text.ts";

export interface HandView {
  content: string;
  components: ButtonRow[];
}

/** Card buttons per page: four rows, the fifth is Draw and the page arrows. */
const PER_PAGE = 20;

const plain = (content: string): HandView => ({ content, components: [] });

/** One page of card buttons, then a row of ◀ Draw ▶. */
function paged(g: Game, cards: Button[], want: number): ButtonRow[] {
  const pages = Math.max(1, Math.ceil(cards.length / PER_PAGE));
  const page = Math.min(Math.max(1, want), pages);
  const shown = cards.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const back = page > 1 ? [button(`shed:page:${page - 1}`, "◀")] : [];
  const next = page < pages ? [button(`shed:page:${page + 1}`, "▶")] : [];

  return [...rows(shown), ...rows([...back, drawButton(g), ...next])];
}

function turnButtons(g: Game, s: Seat, page: number): ButtonRow[] {
  if (g.step === "paint") return rows(paintButtons(g));

  if (g.step === "drawn") return rows(drawnButtons(g, s));

  return paged(g, playButtons(g, s), page);
}

function status(g: Game, mine: boolean): string {
  if (!mine) return `Waiting for ${nameAt(g, g.turn)}.`;

  if (g.step === "paint") return "Pick the colour.";

  if (g.step === "drawn") return "You drew a card that plays. Play it or pass.";

  return g.pending ? `+${g.pending.total} waiting on you: answer it or take it.` : "Your turn.";
}

/** A player's private view: their hand, and on their turn the moves they can make. */
export function handView(g: Game, userId: string, page: number): HandView {
  const i = g.seats.findIndex((s) => s.userId === userId);
  const s = g.seats[i];

  if (g.phase === "lobby") return plain("The game hasn't started yet.");

  if (g.phase === "over") return plain("This game is over.");

  if (!s) return plain("You're not in this game.");

  if (s.dropped) return plain("You left this game.");

  if (s.place !== null) return plain("You're out of cards. Well played!");

  const mine = i === g.turn;
  const content = [
    `Top: **${topLabel(g)}**`,
    `**Your hand (${s.hand.length}):** ${handText(s.hand)}`,
    status(g, mine),
  ].join("\n");

  return { content, components: mine ? turnButtons(g, s, page) : [] };
}
