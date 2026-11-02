import type { Award, Game } from "../types.ts";
import { renderBoard } from "./board.ts";
import { buttons } from "./buttons.ts";
import { renderStatus } from "./status.ts";

/** The game message: board, status, and on the winning move the award breakdown. */
export function view(g: Game, now: number, award?: Award | null) {
  const base = `${renderBoard(g)}\n${renderStatus(g, now)}`;
  const lines = award ? [...award.parts, `**+${award.points} points**`] : [];

  return {
    content: award ? `${base}\n\n${lines.join("\n")}` : base,
    components: buttons(g),
    allowedMentions: { parse: [] as [] },
  };
}
