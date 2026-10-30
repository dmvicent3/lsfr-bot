import { escapeMarkdown } from "discord.js";
import type { Refusal } from "../game/guard.ts";
import type { CardKind } from "../text.ts";

export const NO_GAME = "No game is running here.";

const REFUSALS: Record<Refusal, string> = {
  stale: "That round is over.",
  closed: "That part of the round is closed.",
  "not-in": "You're not playing this round.",
};

const VOTES = {
  voted: "Vote counted.",
  changed: "Vote changed.",
  own: "You can't vote for your own card.",
  ...REFUSALS,
  "not-in": "Only players can vote.",
};

export const voteReply = (out: keyof typeof VOTES): string => VOTES[out];

const PLAYS = { played: "", first: "", already: "You've already played this round.", ...REFUSALS };

/** Empty when the play went through (the hand view says the rest). */
export const playReply = (out: keyof typeof PLAYS): string => PLAYS[out];

export const JOINS = {
  joined: "You're in!",
  already: "You're already in.",
  full: "This game is full (10 players).",
  over: "That game is over.",
} as const;

export const LEAVES = { left: "You left the game.", "not-in": "You're not in this game." } as const;

export const STARTS = {
  started: "Dealt! Press **Your hand** to play.",
  "not-starter": "Only the person who opened the lobby can start it.",
  "too-few": "You need at least 3 players to start.",
  "not-lobby": "The game has already started.",
} as const;

export const addReply = (kind: CardKind, card: { id: number; text: string }): string =>
  `Added ${kind} #${card.id}: ${escapeMarkdown(card.text)}`;
