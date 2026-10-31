import type { APIActionRowComponent, APIComponentInMessageActionRow, APIEmbed } from "discord.js";
import type { Game, Outcome } from "../types.ts";

/** What the board message shows: the game, how it stands, and whether jevos is aiming. */
export interface GameView {
  game: Game;
  outcome: Outcome;
  aiming: boolean;
}

export type Row = APIActionRowComponent<APIComponentInMessageActionRow>;

export interface BoardMessage {
  embeds: APIEmbed[];
  components: Row[];
}
