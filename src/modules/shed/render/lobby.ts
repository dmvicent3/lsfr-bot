import { ButtonStyle, escapeMarkdown } from "discord.js";
import { type Game, MAX_PLAYERS, MIN_PLAYERS } from "../game/types.ts";
import type { Outgoing } from "../../trivia/session/types.ts";
import { TITLE, button, rows, until } from "./parts.ts";

/** The lobby: who's in, stacking, and Join / Leave / Start / Stacking. */
export function lobbyMessage(g: Game): Outgoing {
  const names = g.seats.map((s) => escapeMarkdown(s.name)).join(", ");
  const starter = escapeMarkdown(
    g.seats.find((s) => s.userId === g.startedBy)?.name ?? "The starter",
  );
  const stacking = g.stacking ? "on" : "off";
  const description = [
    "Shed your hand: match the colour or the value. Last one holding cards loses.",
    `**Players (${g.seats.length}/${MAX_PLAYERS}):** ${names}`,
    `Stacking: ${stacking}`,
    `${starter} starts it once ${MIN_PLAYERS}+ have joined · closes ${until(g.lobbyEndsAt)}`,
  ].join("\n\n");

  return {
    embeds: [{ title: `${TITLE} — lobby`, description }],
    components: rows([
      button("shed:join", "Join", ButtonStyle.Success),
      button("shed:leave", "Leave"),
      button("shed:start", "Start", ButtonStyle.Primary),
      button("shed:stacking", `Stacking: ${stacking}`),
    ]),
  };
}
