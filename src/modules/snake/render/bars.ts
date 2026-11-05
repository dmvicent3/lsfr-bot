import type { Tile } from "../types.ts";
import type { Bar } from "./types.ts";

/** The tiles grouped into the shapes the picture draws: each joined run is one bar. */
export function barsOf(tiles: Tile[]): Bar[] {
  const bars: Bar[] = [];

  for (const [k, t] of tiles.entries()) {
    const last = bars.at(-1);

    if (last && tiles[k - 1]?.joinNext) {
      last.to = k;
      last.capEnd ||= t.capEnd;
      continue;
    }

    bars.push({ from: k, to: k, colour: t.colour, capStart: t.capStart, capEnd: t.capEnd });
  }

  return bars;
}
