import type { Deck } from "../types.ts";
import { openRound } from "./open.ts";
import { discardCards, drawCards, newPile } from "./piles.ts";
import { type Game, HAND, LOBBY_MS, MAX_PLAYERS, MIN_PLAYERS } from "./types.ts";

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
export function join(
  g: Game,
  who: Who,
  random: () => number,
): "joined" | "already" | "full" | "over" {
  if (g.phase === "over") return "over";

  if (g.players.some((p) => p.userId === who.userId)) return "already";

  if (g.players.length >= MAX_PLAYERS) return "full";

  const live = g.phase !== "lobby";
  const hand = live ? drawCards(g.answers, HAND, random) : [];
  g.players.push({ ...who, hand, idle: 0, from: g.rounds + 1 });
  g.names.set(who.userId, who.name);

  return "joined";
}

export function leave(g: Game, userId: string): "left" | "not-in" {
  const player = g.players.find((p) => p.userId === userId);

  if (!player) return "not-in";

  const half = g.round?.partial.get(userId);
  discardCards(g.answers, half ? [...player.hand, half] : player.hand);
  g.round?.partial.delete(userId);
  g.players = g.players.filter((p) => p !== player);

  if (g.phase === "lobby") handOver(g);

  return "left";
}

/** A lobby whose starter left passes Start to the next player; an empty lobby closes. */
function handOver(g: Game): void {
  const next = g.players[0];

  if (!next) {
    g.phase = "over";
    g.endReason = "lobby";

    return;
  }

  if (!g.players.some((p) => p.userId === g.startedBy)) g.startedBy = next.userId;
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
