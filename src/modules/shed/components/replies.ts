import type { catchOut } from "../game/catch.ts";
import type { drawOne, keepDrawn, passDrawn } from "../game/draw.ts";
import type { join, leaveLobby, startGame, toggleStacking } from "../game/lobby.ts";
import type { pickColour } from "../game/paint.ts";
import type { PlayResult } from "../game/play.ts";
import type { quitGame } from "../game/quit.ts";
import type { Refusal } from "../game/types.ts";

export const NO_GAME = "No game is running here.";

const REFUSALS: Record<Refusal, string> = {
  over: "This game is over.",
  "not-in": "You're not in this game.",
  "not-your-turn": "It's not your turn.",
  stale: "That turn is over — here's your hand now.",
};

const WRONG_STEP = "Finish this step first (see the buttons below).";

export const PLAYS: Record<PlayResult, string> = {
  ...REFUSALS,
  played: "Played.",
  "pick-colour": "Played. Now pick the colour.",
  illegal: "That isn't legal on the top card.",
  "not-held": "You don't have that many.",
  "no-stacking": "Stacking is off in this game.",
};

export const DRAWS: Record<ReturnType<typeof drawOne>, string> = {
  ...REFUSALS,
  "can-play": "You drew a card that plays.",
  passed: "You drew a card. Your turn passed.",
  took: "You took the cards. Your turn passed.",
  "wrong-step": WRONG_STEP,
};

export const KEEPS: Record<ReturnType<typeof keepDrawn>, string> = {
  ...REFUSALS,
  played: "Played.",
  "pick-colour": "Played. Now pick the colour.",
  "wrong-step": WRONG_STEP,
};

export const PASSES: Record<ReturnType<typeof passDrawn>, string> = {
  ...REFUSALS,
  passed: "You kept it. Your turn passed.",
  "wrong-step": WRONG_STEP,
};

export const PAINTS: Record<ReturnType<typeof pickColour>, string> = {
  ...REFUSALS,
  picked: "Colour picked.",
  "wrong-step": WRONG_STEP,
};

export const CATCHES: Record<ReturnType<typeof catchOut>, string> = {
  caught: "Caught! They draw 2.",
  nobody: "Nobody to catch right now.",
  self: "You can't catch yourself.",
  "not-in": "Only players can catch.",
  over: "This game is over.",
};

export const QUITS: Record<ReturnType<typeof quitGame>, string> = {
  left: "You left the game.",
  "not-in": "You're not in this game.",
  over: "This game is over.",
};

export const JOINS: Record<ReturnType<typeof join>, string> = {
  joined: "You're in.",
  already: "You're already in.",
  full: "The table is full (8).",
  started: "The game has started.",
  elsewhere: "You're in a game in another channel.",
};

export const LEAVES: Record<ReturnType<typeof leaveLobby>, string> = {
  left: "You left the lobby.",
  "not-in": "You're not in this lobby.",
  started: "The game has started. Use **Leave** on the board to quit it.",
};

export const STARTS: Record<ReturnType<typeof startGame>, string> = {
  started: "Dealt! Press **My hand** to see your cards.",
  "not-starter": "Only the person who opened the lobby can start it.",
  "too-few": "You need at least 2 players to start.",
  "started-already": "The game has already started.",
};

export const STACKINGS: Record<ReturnType<typeof toggleStacking>, string> = {
  on: "Stacking is on.",
  off: "Stacking is off.",
  "not-starter": "Only the person who opened the lobby can change that.",
  started: "The game has started.",
};
