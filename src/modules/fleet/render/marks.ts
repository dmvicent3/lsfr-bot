import { jevosToMove } from "../game.ts";
import { shipCells } from "../grid.ts";
import { nextKind } from "../place.ts";
import { sunkShips } from "../shots.ts";
import { FLEET, type Game, type Side } from "../types.ts";

/** What one cell shows: open water, an unhit ship, or a shot that missed, hit or sank. */
export type Mark = "water" | "ship" | "miss" | "hit" | "sunk";

/** How one cell of `side`'s waters looks after `shots` from the other side. */
function shotMark(side: Side, shots: Set<number>, sunk: Set<number>, c: number): Mark | null {
  const ship = side.ships.find((s) => s.cells.includes(c));

  if (!shots.has(c)) return null;

  if (!ship) return "miss";

  return sunk.has(ship.kind) ? "sunk" : "hit";
}

/** Each cell of `side`'s waters after `shots`; `showShips` shows its unhit ships too. */
function marks(side: Side, shots: number[], showShips: boolean): (c: number) => Mark {
  const fired = new Set(shots);
  const sunk = new Set(sunkShips(side.ships, shots));
  const ships = new Set(side.ships.flatMap((s) => s.cells));

  return (c) => shotMark(side, fired, sunk, c) ?? (showShips && ships.has(c) ? "ship" : "water");
}

/** The player's own waters: their ships, and jevos's shots on them. */
export const ownMarks = (g: Game): ((c: number) => Mark) => marks(g.player, g.jevos.shots, true);

/** jevos's waters as the player sees them; `reveal` shows its unhit ships at the end. */
export const targetMarks = (g: Game, reveal: boolean): ((c: number) => Mark) =>
  marks(g.jevos, g.player.shots, reveal);

/** The cells the next ship would cover from the cursor; just the cursor when it won't fit. */
export function previewCells(g: Game): Set<number> {
  const kind = nextKind(g.player.ships);

  if (kind === null) return new Set();

  return new Set(shipCells(g.cursor, FLEET[kind]?.size ?? 0, g.dir) ?? [g.cursor]);
}

/** The firing cursor on jevos's waters: only while the player is to shoot. */
export const aimedCell = (g: Game, reveal: boolean): number | null =>
  !reveal && !jevosToMove(g) ? g.cursor : null;
