import type { APIActionRowComponent, APIButtonComponentWithCustomId, APIEmbed } from "discord.js";

export type Disc = "R" | "Y";

export type Cell = Disc | null;

/** 42 cells, index `row * 7 + col`, row 0 at the top. */
export type Board = readonly Cell[];

export type Difficulty = "easy" | "normal" | "hard";

export const COLS = 7;

export const ROWS = 6;

/** jevos's drop; `share` is its part of all the yeses, null when jevos blanked and guessed. */
export interface JevosPick {
  col: number;
  share: number | null;
}

/** A player's live game; the table holds at most one per player per server. */
export interface Game {
  guildId: string;
  playerId: string;
  channelId: string;
  /** The board message; null until it is sent. */
  messageId: string | null;
  board: Board;
  first: "player" | "jevos";
  difficulty: Difficulty;
  startedAt: number;
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

export type MoveError = "full" | "not-your-turn" | "over";

export interface NewGame {
  guildId: string;
  channelId: string;
  playerId: string;
  difficulty: Difficulty;
  now: number;
  random: () => number;
}

export type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

/** What the board message shows: the game, how it stands, and jevos's last drop. */
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
