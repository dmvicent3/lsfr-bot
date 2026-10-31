import type { Ship } from "./types.ts";

export type ShotResult = { kind: "miss" } | { kind: "hit"; ship: number; sunk: boolean };

const isSunk = (ship: Ship, shots: Set<number>): boolean => ship.cells.every((c) => shots.has(c));

/** What a shot at `cell` did, with `shots` the firing side's shots so far (including it). */
export function shotResult(ships: Ship[], shots: number[], cell: number): ShotResult {
  const ship = ships.find((s) => s.cells.includes(cell));

  if (!ship) return { kind: "miss" };

  return { kind: "hit", ship: ship.kind, sunk: isSunk(ship, new Set(shots)) };
}

/** The kinds sunk by `shots`. */
export function sunkShips(ships: Ship[], shots: number[]): number[] {
  const fired = new Set(shots);

  return ships.filter((s) => isSunk(s, fired)).map((s) => s.kind);
}

export const allSunk = (ships: Ship[], shots: number[]): boolean =>
  sunkShips(ships, shots).length === ships.length;

/** How many of `shots` hit a ship. */
export function hits(ships: Ship[], shots: number[]): number {
  const cells = new Set(ships.flatMap((s) => s.cells));

  return shots.filter((c) => cells.has(c)).length;
}
