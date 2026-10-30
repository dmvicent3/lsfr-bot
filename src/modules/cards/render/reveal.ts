import type { Game } from "../game/types.ts";
import type { Outgoing } from "../../trivia/session/types.ts";
import { TITLE, nameOf, standings } from "./parts.ts";
import { answerOf } from "./round.ts";

const votes = (n: number): string => `${n} vote${n === 1 ? "" : "s"}`;

/** Each answer with its author and votes, most first, then the winner and the scores. */
export function revealMessage(g: Game): Outgoing {
  const r = g.round;

  if (!r) return { content: "…" };

  const count = (author: string): number =>
    [...r.votes.values()].filter((a) => a === author).length;
  const lines = r.order
    .toSorted((a, b) => count(b) - count(a))
    .map((a) => `${answerOf(r, a)}\n-# ${nameOf(g, a)} — ${votes(count(a))}`);
  const winners = r.winners.map((id) => nameOf(g, id)).join(" and ");
  const result = winners ? `🏆 ${winners} wins the round` : "Nobody voted. No point this round.";

  return {
    embeds: [
      {
        title: `${TITLE} — round ${g.rounds} results`,
        description: [...lines, "", result].join("\n"),
        footer: { text: standings(g) },
      },
    ],
    components: [],
  };
}

const REASONS: Record<string, string> = {
  target: "We have a winner!",
  players: "Fewer than 3 players left, so the game is over.",
  empty: "Nobody played for 3 rounds, so the game is over.",
  stop: "The game was stopped.",
  lobby: "Nobody started the game in time.",
};

/** Why the game ended and the final scores. */
export function overMessage(g: Game): Outgoing {
  const top = Math.max(0, ...g.points.values());
  const champs = [...g.points].filter(([, n]) => n === top && top > 0).map(([id]) => nameOf(g, id));
  const crown =
    g.endReason === "target" && champs.length > 0 ? `\n\n👑 **${champs.join(" and ")}**` : "";

  return {
    embeds: [
      {
        title: `${TITLE} — game over`,
        description: `${REASONS[g.endReason ?? "stop"] ?? ""}${crown}\n\n${standings(g)}`,
      },
    ],
    components: [],
  };
}
