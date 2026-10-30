import { ButtonStyle } from "discord.js";
import type { Game } from "../game/types.ts";
import { MIN_PLAYERS } from "../game/types.ts";
import type { Outgoing } from "../../trivia/session/types.ts";
import { TITLE, button, nameOf, rows, until } from "./parts.ts";

/** The lobby: who's in, the target, and Join / Leave / Start. */
export function lobbyMessage(g: Game): Outgoing {
  const names = g.players.map((p) => nameOf(g, p.userId)).join(", ");
  const description = [
    `First to **${g.target}** points. Fill the blanks from your hand, then everyone votes.`,
    `**Players (${g.players.length}):** ${names}`,
    `${nameOf(g, g.startedBy)} starts it once ${MIN_PLAYERS}+ have joined · closes ${until(g.deadline)}`,
  ].join("\n\n");

  return {
    embeds: [{ title: `${TITLE} — lobby`, description }],
    components: rows([
      button("cards:join", "Join", ButtonStyle.Success),
      button("cards:leave", "Leave"),
      button("cards:start", "Start", ButtonStyle.Primary),
    ]),
  };
}
