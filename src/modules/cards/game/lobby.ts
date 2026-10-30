import type { Deck } from "../types.ts";
import { discardCards, drawCards, newPile } from "./piles.ts";
import { type Game, HAND, LOBBY_MS, MIN_PLAYERS, PLAY_MS } from "./types.ts";

interface Who {
  userId: string;
  name: string;
}

export function newGame(p: {
  id: number;
  guildId: string;
  channelId: string;
  starter: Who;
  target: number;
  deck: Deck;
  random: () => number;
  now: number;
}): Game {
  return {
    id: p.id,
    guildId: p.guildId,
    channelId: p.channelId,
    startedBy: p.starter.userId,
    target: p.target,
    phase: "lobby",
    deadline: p.now + LOBBY_MS,
    players: [{ ...p.starter, hand: [], idle: 0, from: 1 }],
    rounds: 0,
    emptyRounds: 0,
    prompts: newPile(p.deck.prompts, p.random),
    answers: newPile(p.deck.answers, p.random),
    round: null,
    points: new Map(),
    names: new Map([[p.starter.userId, p.starter.name]]),
    endReason: null,
  };
}

/** In the lobby a seat; mid-game a hand too, playing from the next round. */
export function join(g: Game, who: Who, random: () => number): "joined" | "already" | "over" {
  if (g.phase === "over") return "over";

  if (g.players.some((p) => p.userId === who.userId)) return "already";

  const live = g.phase !== "lobby";
  const hand = live ? drawCards(g.answers, HAND, random) : [];
  g.players.push({ ...who, hand, idle: 0, from: g.rounds + 1 });
  g.names.set(who.userId, who.name);

  return "joined";
}

export function leave(g: Game, userId: string): "left" | "not-in" {
  const player = g.players.find((p) => p.userId === userId);

  if (!player) return "not-in";

  discardCards(g.answers, player.hand);
  g.players = g.players.filter((p) => p !== player);

  return "left";
}

/** Draws the next prompt and opens a 60 s round; no prompt left at all ends the game. */
export function openRound(g: Game, now: number, random: () => number): void {
  const [prompt] = drawCards(g.prompts, 1, random);

  if (!prompt) {
    g.phase = "over";
    g.endReason = "empty";

    return;
  }

  g.rounds += 1;
  g.round = {
    id: `${g.id}-${g.rounds}`,
    prompt,
    plays: new Map(),
    partial: new Map(),
    played: [],
    order: [],
    votes: new Map(),
    winners: [],
  };
  g.phase = "playing";
  g.deadline = now + PLAY_MS;
}

export function startGame(
  g: Game,
  userId: string,
  now: number,
  random: () => number,
): "started" | "not-starter" | "too-few" | "not-lobby" {
  if (g.phase !== "lobby") return "not-lobby";

  if (userId !== g.startedBy) return "not-starter";

  if (g.players.length < MIN_PLAYERS) return "too-few";

  for (const p of g.players) p.hand = drawCards(g.answers, HAND, random);

  openRound(g, now, random);

  return "started";
}
