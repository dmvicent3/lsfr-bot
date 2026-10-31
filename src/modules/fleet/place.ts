import { shipCells } from "./grid.ts";
import { type Dir, FLEET, SIZE, type Ship } from "./types.ts";

const RANDOM_TRIES = 50;

const DIRS: readonly Dir[] = ["across", "down"];

/** The next kind to place, in fleet order; null when all five are down. */
export const nextKind = (ships: Ship[]): number | null =>
  ships.length < FLEET.length ? ships.length : null;

/** The next ship placed from `start`; touching is fine, overlapping is not. */
export function placeAt(
  ships: Ship[],
  p: { start: number; dir: Dir },
): Ship[] | { error: "off-grid" | "overlap" | "done" } {
  const kind = nextKind(ships);

  if (kind === null) return { error: "done" };

  const cells = shipCells(p.start, FLEET[kind]?.size ?? 0, p.dir);

  if (!cells) return { error: "off-grid" };

  const taken = new Set(ships.flatMap((s) => s.cells));

  if (cells.some((c) => taken.has(c))) return { error: "overlap" };

  return [...ships, { kind, cells }];
}

export const undoShip = (ships: Ship[]): Ship[] => ships.slice(0, -1);

const randomSpot = (random: () => number) => ({
  start: Math.floor(random() * SIZE * SIZE),
  dir: DIRS[Math.floor(random() * 2)] ?? "across",
});

/** Every legal next placement, for when random tries keep failing. */
function everyLegal(ships: Ship[]): Ship[][] {
  const out: Ship[][] = [];

  for (let start = 0; start < SIZE * SIZE; start++) {
    for (const dir of DIRS) {
      const next = placeAt(ships, { start, dir });

      if (!("error" in next)) out.push(next);
    }
  }

  return out;
}

function placeOne(ships: Ship[], random: () => number): Ship[] {
  for (let n = 0; n < RANDOM_TRIES; n++) {
    const next = placeAt(ships, randomSpot(random));

    if (!("error" in next)) return next;
  }

  const legal = everyLegal(ships);

  return legal[Math.floor(random() * legal.length)] ?? ships;
}

/** Places every remaining kind at random legal spots. */
export function fillFleet(ships: Ship[], random: () => number): Ship[] {
  let out = ships;

  while (nextKind(out) !== null) {
    const next = placeOne(out, random);

    if (next === out) return out;

    out = next;
  }

  return out;
}
