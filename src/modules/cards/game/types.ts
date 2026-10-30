import type { Card, Pile, Prompt } from "../types.ts";

export type Phase = "lobby" | "playing" | "voting" | "reveal" | "over";

export type EndReason = "target" | "players" | "empty" | "stop" | "lobby";

export interface Player {
  userId: string;
  name: string;
  hand: Card[];
  /** Rounds in a row with neither a play nor a vote. */
  idle: number;
  /** The first round they can play in (a mid-round joiner waits for the next). */
  from: number;
}

export interface Round {
  /** `<gameId>-<n>`, carried in button ids so old buttons are refused. */
  id: string;
  prompt: Prompt;
  /** Complete plays, in pick order. */
  plays: Map<string, Card[]>;
  /** The first pick of a two-blank prompt. */
  partial: Map<string, Card>;
  /** Who completed a play, kept when a void round hands the cards back. */
  played: string[];
  /** Authors in the shuffled order the answers are shown for voting. */
  order: string[];
  /** Voter → author voted for. */
  votes: Map<string, string>;
  winners: string[];
}

export interface Game {
  id: number;
  guildId: string;
  channelId: string;
  startedBy: string;
  target: number;
  phase: Phase;
  deadline: number;
  players: Player[];
  /** Rounds opened so far; the open round is number `rounds`. */
  rounds: number;
  /** Rounds in a row with no plays at all. */
  emptyRounds: number;
  prompts: Pile<Prompt>;
  answers: Pile<Card>;
  round: Round | null;
  points: Map<string, number>;
  endReason: EndReason | null;
}

export const HAND = 7;
export const MIN_PLAYERS = 3;
export const LOBBY_MS = 5 * 60_000;
export const PLAY_MS = 60_000;
export const VOTE_MS = 30_000;
export const REVEAL_MS = 8_000;
