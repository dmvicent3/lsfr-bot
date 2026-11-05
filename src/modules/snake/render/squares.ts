import type { Colour, Tile } from "../types.ts";

/** The guess's first or last letter on the word's first or last: it starts or ends as the word does. */
export const CAP = "🟢";

/** A green joined to a neighbour: side by side in the word too. */
export const JOINED = "💚";

export const SQUARE: Record<Colour, string> = { green: "🟩", yellow: "🟨", dark: "⬛" };

function square(t: Tile, joined: boolean): string {
  if (t.capStart || t.capEnd) return CAP;

  return t.colour === "green" && joined ? JOINED : SQUARE[t.colour];
}

/**
 * One emoji per tile; a cap wins over the joined marker. Two joined runs side by side in the
 * guess read as one run of 💚.
 */
export const squares = (tiles: Tile[]): string =>
  tiles.map((t, k) => square(t, t.joinNext || tiles[k - 1]?.joinNext === true)).join("");
