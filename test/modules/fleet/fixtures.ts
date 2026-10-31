import { parseCell, shipCells } from "../../../src/modules/fleet/grid.ts";
import { type Dir, FLEET, type Ship } from "../../../src/modules/fleet/types.ts";

/** Ships from cell names, e.g. `{ 0: { start: "A1", dir: "down" } }` (keys are fleet kinds). */
export function fleetAt(spec: Record<number, { start: string; dir: Dir }>): Ship[] {
  return Object.entries(spec).map(([k, { start, dir }]) => {
    const kind = Number(k);
    const cells = shipCells(parseCell(start) ?? -1, FLEET[kind]?.size ?? 0, dir);

    if (!cells) throw new Error(`ship ${kind} at ${start} is off the grid`);

    return { kind, cells };
  });
}
