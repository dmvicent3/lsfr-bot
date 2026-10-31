import { deal } from "./deal.ts";
import { seat } from "./new.ts";
import { type Game, MAX_PLAYERS, MIN_PLAYERS, type Who } from "./types.ts";

const seated = (g: Game, userId: string): boolean => g.seats.some((s) => s.userId === userId);

/** A seat in the lobby; `elsewhere` when the person is in another game in the server. */
export function join(
  g: Game,
  who: Who,
  elsewhere: boolean,
): "joined" | "already" | "full" | "started" | "elsewhere" {
  if (g.phase !== "lobby") return "started";

  if (seated(g, who.userId)) return "already";

  if (elsewhere) return "elsewhere";

  if (g.seats.length >= MAX_PLAYERS) return "full";

  g.seats.push(seat(who));

  return "joined";
}

/** Leaving the lobby; the start passes to the next seat, and an empty lobby closes. */
export function leaveLobby(g: Game, userId: string): "left" | "not-in" | "started" {
  if (g.phase !== "lobby") return "started";

  if (!seated(g, userId)) return "not-in";

  g.seats = g.seats.filter((s) => s.userId !== userId);
  const next = g.seats[0];

  if (!next) {
    g.phase = "over";
    g.endReason = "lobby";

    return "left";
  }

  if (g.startedBy === userId) g.startedBy = next.userId;

  return "left";
}

export function toggleStacking(g: Game, userId: string): "on" | "off" | "not-starter" | "started" {
  if (g.phase !== "lobby") return "started";

  if (g.startedBy !== userId) return "not-starter";

  g.stacking = !g.stacking;

  return g.stacking ? "on" : "off";
}

export function startGame(
  g: Game,
  userId: string,
  now: number,
  random: () => number,
): "started" | "not-starter" | "too-few" | "started-already" {
  if (g.phase !== "lobby") return "started-already";

  if (g.startedBy !== userId) return "not-starter";

  if (g.seats.length < MIN_PLAYERS) return "too-few";

  g.phase = "playing";
  deal(g, now, random);

  return "started";
}
