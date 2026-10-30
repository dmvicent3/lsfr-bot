import { openVoting } from "./play.ts";
import { closeVoting, finishRound } from "./tally.ts";
import { type Game, MIN_PLAYERS } from "./types.ts";
import { allVoted } from "./vote.ts";
import { allPlayed } from "./play.ts";

export type Change = "lobby-expired" | "voting" | "void" | "reveal" | "next" | "over";

function end(g: Game, reason: "lobby" | "players"): Change {
  g.phase = "over";
  g.endReason = reason;

  return reason === "lobby" ? "lobby-expired" : "over";
}

function afterPlaying(g: Game, now: number, random: () => number): Change | null {
  if (!allPlayed(g) && now < g.deadline) return null;

  if (openVoting(g, now, random) === "voting") return "voting";

  finishRound(g, now, random);

  return g.phase === "over" ? "over" : "void";
}

function afterReveal(g: Game, now: number, random: () => number): Change | null {
  if (now < g.deadline) return null;

  finishRound(g, now, random);

  return g.phase === "over" ? "over" : "next";
}

/** One tick of the game: whatever the clock or the last click has made due. */
export function advance(g: Game, now: number, random: () => number): Change | null {
  if (g.phase === "over") return null;

  if (g.phase === "lobby") return now >= g.deadline ? end(g, "lobby") : null;

  /** The reveal finishes first, so a target reached in it still counts. */
  if (g.players.length < MIN_PLAYERS && g.phase !== "reveal") return end(g, "players");

  if (g.phase === "playing") return afterPlaying(g, now, random);

  if (g.phase === "voting") {
    if (!allVoted(g) && now < g.deadline) return null;

    closeVoting(g, now);

    return "reveal";
  }

  return afterReveal(g, now, random);
}
