import { colOf, rowOf, toIndex } from "./grid.ts";
import type { Direction, Game } from "./types.ts";

/** Column and row change of one step. */
const DELTAS: Record<Direction, [dc: number, dr: number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** True when one step that way stays on the board. */
export function canStep(game: Game, dir: Direction): boolean {
  const [dc, dr] = DELTAS[dir];
  const col = colOf(game.cursor, game.width) + dc;
  const row = rowOf(game.cursor, game.width) + dr;

  return col >= 0 && col < game.width && row >= 0 && row < game.height;
}

/** The cursor one cell that way; it stays put at an edge. */
export function stepCursor(game: Game, dir: Direction): Game {
  if (!canStep(game, dir)) return game;

  const [dc, dr] = DELTAS[dir];
  const col = colOf(game.cursor, game.width) + dc;
  const row = rowOf(game.cursor, game.width) + dr;

  return { ...game, cursor: toIndex(col, row, game.width) };
}
