import { parseCell, shipCells } from "../../../src/modules/fleet/grid.ts";
import { type Dir, FLEET, type Game, type Ship } from "../../../src/modules/fleet/types.ts";

/** Ships from cell names, e.g. `{ 0: { start: "A1", dir: "down" } }` (keys are fleet kinds). */
export function fleetAt(spec: Record<number, { start: string; dir: Dir }>): Ship[] {
  return Object.entries(spec).map(([k, { start, dir }]) => {
    const kind = Number(k);
    const cells = shipCells(parseCell(start) ?? -1, FLEET[kind]?.size ?? 0, dir);

    if (!cells) throw new Error(`ship ${kind} at ${start} is off the grid`);

    return { kind, cells };
  });
}

/** A five-ship fleet in rows 1, 3, 5, 7 and 9, all starting at A. */
export const rowsFleet = (): Ship[] =>
  fleetAt({
    0: { start: "A1", dir: "across" },
    1: { start: "A3", dir: "across" },
    2: { start: "A5", dir: "across" },
    3: { start: "A7", dir: "across" },
    4: { start: "A9", dir: "across" },
  });

/** A game already playing, player first, both fleets in `rowsFleet`, nothing fired. */
export const playing = (over: Partial<Game> = {}): Game => ({
  guildId: "g",
  playerId: "u",
  channelId: "c",
  messageId: "m",
  fleetMessageId: null,
  difficulty: "normal",
  phase: "playing",
  first: "player",
  player: { ships: rowsFleet(), shots: [] },
  jevos: { ships: rowsFleet(), shots: [] },
  cursor: 0,
  dir: "across",
  startedAt: 0,
  updatedAt: 0,
  ...over,
});
