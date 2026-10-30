import { ButtonStyle } from "discord.js";
import type { Game, Round } from "../game/types.ts";
import { blankPrompt, fillPrompt } from "../text.ts";
import type { Outgoing } from "../../trivia/session/types.ts";
import { TITLE, button, nameOf, rows, standings, until } from "./parts.ts";

const heading = (g: Game): string => `${TITLE} — round ${g.rounds} · first to ${g.target}`;

const pickLine = (r: Round): string =>
  r.prompt.blanks === 2 ? "Pick **2** cards, in order." : "Pick a card.";

/** The prompt, who has played (names only), and the hand button. */
export function playingMessage(g: Game): Outgoing {
  const r = g.round;

  if (!r) return { content: "…" };

  const eligible = g.players.filter((p) => p.from <= g.rounds);
  const played = eligible.map(
    (p) => `${r.plays.has(p.userId) ? "✅" : "⏳"} ${nameOf(g, p.userId)}`,
  );
  const description = [
    `## ${blankPrompt(r.prompt.text)}`,
    `${pickLine(r)} Voting starts ${until(g.deadline)} or when everyone has played.`,
    played.join("\n"),
  ].join("\n\n");

  return {
    embeds: [{ title: heading(g), description, footer: { text: standings(g) } }],
    components: rows([
      button("cards:hand", "Your hand", ButtonStyle.Primary),
      button("cards:join", "Join"),
      button("cards:leave", "Leave"),
    ]),
  };
}

export const answerOf = (r: Round, author: string): string =>
  fillPrompt(
    r.prompt.text,
    (r.plays.get(author) ?? []).map((c) => c.text),
  );

/** Every answer filled into the prompt, numbered, with a vote button each. */
export function votingMessage(g: Game): Outgoing {
  const r = g.round;

  if (!r) return { content: "…" };

  const lines = r.order.map((author, i) => `**${i + 1}.** ${answerOf(r, author)}`);
  const voted = `${r.votes.size}/${g.players.length} voted · closes ${until(g.deadline)}`;

  return {
    embeds: [{ title: heading(g), description: [...lines, "", voted].join("\n") }],
    components: rows(r.order.map((_, i) => button(`cards:vote:${r.id}:${i}`, `${i + 1}`))),
  };
}
