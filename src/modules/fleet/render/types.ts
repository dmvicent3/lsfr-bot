import type { APIActionRowComponent, APIComponentInMessageActionRow, APIEmbed } from "discord.js";
import type { Game, Outcome } from "../types.ts";
import type { Mark } from "./marks.ts";

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

/** A spot on the board image, in pixels. */
export interface Point {
  x: number;
  y: number;
}

/** How one `<text>` is drawn. */
export interface TextStyle {
  size: number;
  fill: string;
  bold?: boolean;
}

/** One grid on the image: where it sits, each cell's mark, preview cells and an outlined cursor. */
export interface GridPaint {
  at: Point;
  mark: (c: number) => Mark;
  preview: Set<number>;
  cursor: number | null;
}
