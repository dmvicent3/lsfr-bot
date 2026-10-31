import { type Game, type Seat, TURN_MS } from "./types.ts";

const isActive = (s: Seat): boolean => s.place === null && !s.dropped;

const activeAt = (g: Game, i: number): boolean => {
  const s = g.seats[i];

  return s !== undefined && isActive(s);
};

/** Seats still playing: not out, not dropped. */
export const active = (g: Game): Seat[] => g.seats.filter(isActive);

/** The seat one active seat on from `from` in the current direction. */
function stepOn(g: Game, from: number): number {
  const n = g.seats.length;
  let i = (from + g.direction + n) % n;

  while (!activeAt(g, i) && i !== from) i = (i + g.direction + n) % n;

  return i;
}

/** The seat `steps` active seats after `from` in the current direction; `from` when nobody is. */
export function nextSeat(g: Game, from: number, steps = 1): number {
  if (active(g).length === 0) return from;

  let i = from;

  for (let s = 0; s < steps; s++) i = stepOn(g, i);

  return i;
}

/** Starts `seat`'s turn: a fresh step and clock; their last-card risk ends. */
export function beginTurn(g: Game, seat: number, now: number): void {
  g.turn = seat;
  g.turnNo++;
  g.turnEndsAt = now + TURN_MS;
  g.step = "play";
  g.drawn = null;
  const s = g.seats[seat];

  if (s) s.catchable = false;
}
