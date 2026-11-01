import { colOf, rowOf } from "./grid.ts";
import { fillFleet, nextKind, placeAt, undoShip } from "./place.ts";
import { type Dir, type Game, type PhaseError, SIZE, type Ship } from "./types.ts";

type PlaceError = PhaseError | { error: "off-grid" | "overlap" | "done" };

function withShips(g: Game, ships: Ship[], now: number): Game {
  return { ...g, player: { ...g.player, ships }, updatedAt: now };
}

/** The next ship at the cursor, facing the chosen direction. */
export function placeShip(g: Game, now: number): Game | PlaceError {
  if (g.phase !== "placing") return { error: "phase" };

  const ships = placeAt(g.player.ships, { start: g.cursor, dir: g.dir });

  return "error" in ships ? ships : withShips(g, ships, now);
}

export function undo(g: Game, now: number): Game | PhaseError {
  if (g.phase !== "placing") return { error: "phase" };

  return withShips(g, undoShip(g.player.ships), now);
}

/** Places every ship still to place at random; with all five placed, re-rolls the whole fleet. */
export function randomRest(g: Game, random: () => number, now: number): Game | PhaseError {
  if (g.phase !== "placing") return { error: "phase" };

  const kept = nextKind(g.player.ships) === null ? [] : g.player.ships;

  return withShips(g, fillFleet(kept, random), now);
}

/** Moves the cursor to row or column `value` (0–9), keeping the other. */
export function moveCursor(g: Game, axis: "row" | "col", value: number, now: number): Game {
  const v = Math.min(Math.max(Math.trunc(value), 0), SIZE - 1);
  const cursor = axis === "row" ? v * SIZE + colOf(g.cursor) : rowOf(g.cursor) * SIZE + v;

  return { ...g, cursor, updatedAt: now };
}

export const setDir = (g: Game, dir: Dir, now: number): Game => ({ ...g, dir, updatedAt: now });

/** All five placed: the coin picks who fires first, and firing starts. */
export function ready(
  g: Game,
  random: () => number,
  now: number,
): Game | { error: "phase" | "unplaced" } {
  if (g.phase !== "placing") return { error: "phase" };

  if (nextKind(g.player.ships) !== null) return { error: "unplaced" };

  const first = random() < 0.5 ? "jevos" : "player";

  return { ...g, phase: "playing", first, cursor: 0, updatedAt: now };
}
