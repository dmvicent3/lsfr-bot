export const SIZE = 10;

export type Dir = "across" | "down";

export type Difficulty = "easy" | "normal" | "hard";

/** The fleet in placing order; a ship's `kind` indexes this. */
export const FLEET: readonly { name: string; size: number }[] = [
  { name: "Flagship", size: 5 },
  { name: "Cruiser", size: 4 },
  { name: "Frigate", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Patrol boat", size: 2 },
];

/** Cells are `row * 10 + col`, row 0 is "1" and col 0 is "A". */
export interface Ship {
  kind: number;
  cells: number[];
}

/** One side's fleet and the cells it has fired at on the other side, in order. */
export interface Side {
  ships: Ship[];
  shots: number[];
}

/** A player's live game; the table holds at most one per player per server. */
export interface Game {
  guildId: string;
  playerId: string;
  channelId: string;
  /** The board message; null until it is sent. */
  messageId: string | null;
  difficulty: Difficulty;
  phase: "placing" | "playing";
  /** Who fires first; set by the coin at Ready. */
  first: "player" | "jevos";
  player: Side;
  jevos: Side;
  cursor: number;
  dir: Dir;
  startedAt: number;
  updatedAt: number;
}
