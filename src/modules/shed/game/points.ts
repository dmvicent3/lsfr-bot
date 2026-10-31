import type { Game } from "./types.ts";

export interface PlaceRow {
  userId: string;
  place: number;
  points: number;
}

/** n ranked players: 1st gets n − 1, each place below one fewer. Dropped players get no row; under 2 ranked, none. */
export function points(g: Game): PlaceRow[] {
  const ranked = g.seats
    .filter((s) => s.place !== null && !s.dropped)
    .map((s) => ({ userId: s.userId, place: s.place ?? 0 }))
    .toSorted((a, b) => a.place - b.place);

  if (ranked.length < 2) return [];

  return ranked.map((r, i) => ({ ...r, points: ranked.length - 1 - i }));
}
