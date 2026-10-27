import type { APIActionRowComponent, APIButtonComponentWithCustomId, APIEmbed } from "discord.js";
import type { Jev } from "../../core/jev/types.ts";

export type Mark = "X" | "O";

export type Cell = Mark | null;

/** Squares 0–8, left to right, top to bottom. */
export type Board = readonly Cell[];

/** jevos's move; `share` is its part of all the yeses, null when jevos blanked and guessed. */
export interface JevosPick {
  square: number;
  share: number | null;
}

/** The live game of a server; the table holds at most one per guild. */
export interface Game {
  guildId: string;
  channelId: string;
  /** The board message; null until it is sent. */
  messageId: string | null;
  playerId: string;
  board: Board;
  jevosMark: Mark;
  updatedAt: number;
}

export type Outcome =
  | { kind: "playing" }
  | { kind: "win"; winner: "player" | "jevos"; line: number[] }
  | { kind: "draw" }
  | { kind: "resigned" }
  | { kind: "abandoned" };

export interface Moved {
  game: Game;
  outcome: Outcome;
}

export type MoveError = "taken" | "not-your-turn" | "over";

export interface NewGame {
  guildId: string;
  channelId: string;
  playerId: string;
  now: number;
  random: () => number;
}

export type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

/** What the board message shows: the game, how it stands, and jevos's last move. */
export interface GameView {
  game: Game;
  outcome: Outcome;
  thinking: boolean;
  last: JevosPick | null;
}

export interface BoardMessage {
  embeds: APIEmbed[];
  components: ButtonRow[];
}

export interface JevosTurn {
  moved: Moved;
  last: JevosPick;
}

/** What the command and buttons need beyond the interaction. */
export interface PlayDeps {
  jev: Jev;
  random: () => number;
}

export interface Click {
  messageId: string;
  userId: string;
}

export type ClickVerdict = "play" | "not-yours" | "over";
