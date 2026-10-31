export type Colour = "red" | "yellow" | "green" | "blue";

export type Value =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "block"
  | "turn"
  | "plus2"
  | "paint"
  | "paint4";

/** One card; Paint and Paint +4 have no colour. */
export interface Card {
  id: number;
  colour: Colour | null;
  value: Value;
}

/** A waiting draw against the current player, grown by answering it in kind. */
export interface Pending {
  kind: "plus2" | "paint4";
  total: number;
}

export interface Who {
  userId: string;
  name: string;
}

export interface Seat extends Who {
  hand: Card[];
  /** Turn timeouts in a row; MAX_IDLE drops the player. */
  idle: number;
  /** 1-based finishing place, set when out (or left last). */
  place: number | null;
  dropped: boolean;
  /** Played down to one card without calling it: anyone may Catch until their next turn. */
  catchable: boolean;
}

/** Where the current turn is: choosing a play, deciding on a drawn card, or picking a Paint colour. */
export type Step = "play" | "drawn" | "paint";

export type EndReason = "done" | "stop" | "lobby" | "lost";

export interface Game {
  id: number;
  guildId: string;
  channelId: string;
  startedBy: string;
  stacking: boolean;
  phase: "lobby" | "playing" | "over";
  endReason: EndReason | null;
  seats: Seat[];
  /** Index into seats. */
  turn: number;
  direction: 1 | -1;
  /** Counts turns; carried in custom IDs so a click from an earlier turn is refused. */
  turnNo: number;
  turnEndsAt: number;
  lobbyEndsAt: number;
  /** The top of each pile is its last element. */
  draw: Card[];
  discard: Card[];
  /** The colour to match; null only after a first-card Paint, until someone plays. */
  colour: Colour | null;
  pending: Pending | null;
  step: Step;
  /** The card drawn this turn, while the player decides on it. */
  drawn: Card | null;
  /** The seat whose turn starts once the Paint colour is picked. */
  afterPaint: number | null;
  lastMove: string;
  nextPlace: number;
}

export const TURN_MS = 60_000;
export const LOBBY_MS = 600_000;
export const MAX_IDLE = 3;
export const HAND_SIZE = 7;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/** One click: who made it, on which turn. */
export interface Act {
  userId: string;
  turnNo: number;
  now: number;
  random: () => number;
}

export type Refusal = "over" | "not-in" | "not-your-turn" | "stale";
