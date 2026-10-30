import type { Card } from "../types.ts";
import { openRound } from "./lobby.ts";
import { discardCards, drawCards } from "./piles.ts";
import { type EndReason, type Game, HAND, MIN_PLAYERS, REVEAL_MS } from "./types.ts";

const IDLE_DROP = 2;
const EMPTY_END = 3;

/** Most votes wins a point (ties: each); no votes, no point. Opens the 8 s reveal. */
export function closeVoting(
  g: Game,
  now: number,
): { winners: string[]; counts: Map<string, number> } {
  const counts = new Map<string, number>();

  for (const author of g.round?.votes.values() ?? [])
    counts.set(author, (counts.get(author) ?? 0) + 1);

  const top = Math.max(0, ...counts.values());
  const winners = top > 0 ? [...counts].filter(([, n]) => n === top).map(([id]) => id) : [];

  for (const id of winners) g.points.set(id, (g.points.get(id) ?? 0) + 1);

  if (g.round) g.round.winners = winners;

  g.phase = "reveal";
  g.deadline = now + REVEAL_MS;

  return { winners, counts };
}

export function endCheck(g: Game): EndReason | null {
  if ([...g.points.values()].some((n) => n >= g.target)) return "target";

  if (g.players.length < MIN_PLAYERS) return "players";

  return g.emptyRounds >= EMPTY_END ? "empty" : null;
}

/** Idle counts: a play or a vote resets them; two idle rounds in a row and the player is out. */
function dropIdle(g: Game): void {
  const round = g.round;

  for (const p of g.players) {
    const took = round?.played.includes(p.userId) || round?.votes.has(p.userId);
    p.idle = took || p.from > g.rounds ? 0 : p.idle + 1;

    if (p.idle >= IDLE_DROP) discardCards(g.answers, p.hand);
  }

  g.players = g.players.filter((p) => p.idle < IDLE_DROP);
}

/** Played cards to the discards, idle players out, hands back to 7, then the end check or the next round. */
export function finishRound(g: Game, now: number, random: () => number): void {
  const round = g.round;

  if (round) {
    const played: Card[] = [...round.plays.values()].flat();
    discardCards(g.answers, played);
    discardCards(g.prompts, [round.prompt]);
    g.emptyRounds = round.played.length === 0 ? g.emptyRounds + 1 : 0;
  }

  dropIdle(g);

  for (const p of g.players) p.hand.push(...drawCards(g.answers, HAND - p.hand.length, random));

  const reason = endCheck(g);

  if (reason) {
    g.phase = "over";
    g.endReason = reason;

    return;
  }

  openRound(g, now, random);
}
