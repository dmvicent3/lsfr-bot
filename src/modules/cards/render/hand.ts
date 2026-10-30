import { ButtonStyle, escapeMarkdown } from "discord.js";
import type { Game, Player, Round } from "../game/types.ts";
import { blankPrompt, fillPrompt } from "../text.ts";
import { type ButtonRow, button, rows } from "./parts.ts";

export interface HandView {
  content: string;
  components: ButtonRow[];
}

const plain = (content: string): HandView => ({ content, components: [] });

function playable(r: Round, p: Player): HandView {
  const first = r.partial.get(p.userId);
  const ask = first
    ? `First pick: **${escapeMarkdown(first.text)}**. Now pick the second card.`
    : `Pick ${r.prompt.blanks === 2 ? "your first card" : "a card"}:`;
  const cards = p.hand.map((c) =>
    button(`cards:play:${r.id}:${c.id}`, c.text, ButtonStyle.Secondary),
  );

  return { content: `## ${blankPrompt(r.prompt.text)}\n${ask}`, components: rows(cards) };
}

/** A player's private view of the round: their cards as buttons, or where things stand. */
export function handMessage(g: Game, userId: string): HandView {
  const p = g.players.find((x) => x.userId === userId);
  const r = g.round;

  if (!p) return plain("You're not in this game. Press Join.");

  if (g.phase === "lobby" || !r) return plain("The game hasn't started yet.");

  if (g.phase !== "playing") return plain("Cards are in. Vote in the channel!");

  if (p.from > g.rounds)
    return plain("You joined mid-round. You'll get to play from the next one.");

  const mine = r.plays.get(userId);

  if (mine)
    return plain(
      `You played: ${fillPrompt(
        r.prompt.text,
        mine.map((c) => c.text),
      )}`,
    );

  return playable(r, p);
}
