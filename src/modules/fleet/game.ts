import { fillFleet } from "./place.ts";
import { allSunk } from "./shots.ts";
import type { Game, Moved, NewGame, Outcome } from "./types.ts";

export const ABANDON_MS = 10 * 60_000;

/** A fresh game: the player places their fleet; jevos's is placed at random, hidden. */
export const startGame = (g: NewGame): Game => ({
  guildId: g.guildId,
  playerId: g.playerId,
  channelId: g.channelId,
  messageId: null,
  difficulty: g.difficulty,
  phase: "placing",
  first: "player",
  player: { ships: [], shots: [] },
  jevos: { ships: fillFleet([], g.random), shots: [] },
  cursor: 0,
  dir: "across",
  startedAt: g.now,
  updatedAt: g.now,
});

/** Equal shot counts means whoever fires first is up. */
export function jevosToMove(g: Game): boolean {
  if (g.phase !== "playing") return false;

  const even = g.player.shots.length === g.jevos.shots.length;

  return even === (g.first === "jevos");
}

export function outcomeOf(g: Game): Outcome {
  if (allSunk(g.jevos.ships, g.player.shots)) return { kind: "win", winner: "player" };

  if (allSunk(g.player.ships, g.jevos.shots)) return { kind: "win", winner: "jevos" };

  return { kind: "playing" };
}

export const playerShots = (g: Game): number => g.player.shots.length;

/** The player's shot at the cursor. */
export function playerFire(
  g: Game,
  now: number,
): Moved | { error: "phase" | "not-your-turn" | "fired" | "over" } {
  if (g.phase !== "playing") return { error: "phase" };

  if (outcomeOf(g).kind !== "playing") return { error: "over" };

  if (jevosToMove(g)) return { error: "not-your-turn" };

  if (g.player.shots.includes(g.cursor)) return { error: "fired" };

  const game = {
    ...g,
    player: { ...g.player, shots: [...g.player.shots, g.cursor] },
    updatedAt: now,
  };

  return { game, outcome: outcomeOf(game) };
}

export function jevosFire(g: Game, cell: number, now: number): Moved {
  const game = { ...g, jevos: { ...g.jevos, shots: [...g.jevos.shots, cell] }, updatedAt: now };

  return { game, outcome: outcomeOf(game) };
}

/**
 * What a touch (a click, or the player's next /fleet play) finds, under the player's lock: idle
 * 10 minutes, waiting on a jevos shot nobody is making (a restart or a failed update), or theirs.
 */
export function touch(g: Game, now: number): "idle" | "jevos" | "play" {
  if (now - g.updatedAt >= ABANDON_MS) return "idle";

  return jevosToMove(g) ? "jevos" : "play";
}
