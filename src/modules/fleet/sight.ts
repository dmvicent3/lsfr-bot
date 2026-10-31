import { sunkShips } from "./shots.ts";
import { FLEET, type Game } from "./types.ts";

/** What jevos knows of the player's fleet from its own shots. */
export interface Sight {
  fired: Set<number>;
  misses: number[];
  /** Every cell of each sunk ship. */
  sunk: number[];
  /** Hit cells of ships not sunk yet. */
  wounded: number[];
  /** Sizes of the ships still afloat. */
  afloat: number[];
}

export function sightOf(g: Game): Sight {
  const { ships } = g.player;
  const shots = g.jevos.shots;
  const sunkKinds = new Set(sunkShips(ships, shots));
  const shipOf = (c: number) => ships.find((s) => s.cells.includes(c));
  const live = ships.filter((s) => !sunkKinds.has(s.kind));

  return {
    fired: new Set(shots),
    misses: shots.filter((c) => !shipOf(c)),
    sunk: ships.filter((s) => sunkKinds.has(s.kind)).flatMap((s) => s.cells),
    wounded: shots.filter((c) => live.some((s) => s.cells.includes(c))),
    afloat: live.map((s) => FLEET[s.kind]?.size ?? 0),
  };
}
