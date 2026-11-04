import type { ComponentHandler } from "../../../core/types.ts";
import type { PlayDeps } from "../commands/types.ts";
import { playerFire } from "../game.ts";
import type { Game } from "../types.ts";
import { moveCursor, placeShip, randomRest, ready, setDir, undo } from "../placing.ts";
import { type Change, act } from "./act.ts";

/** A board control: `fleet:<action>`, its change built from the click's args and values. */
function control(
  action: string,
  build: (d: PlayDeps, args: string[], values: string[]) => Change,
): (d: PlayDeps) => ComponentHandler {
  return (d) => ({
    id: `fleet:${action}`,
    async handle(i, args, ctx) {
      const values = i.isStringSelectMenu() ? i.values : [];
      await act(i, { ctx, d }, build(d, args, values));
    },
  });
}

/**
 * `fleet:<axis>:<n>` from the buttons (a board sent before them still carries the select's value);
 * allowed while jevos aims, for the next shot.
 */
const cursor =
  (axis: "row" | "col"): ((d: PlayDeps) => ComponentHandler) =>
  (d) => ({
    id: `fleet:${axis}`,
    async handle(i, args, ctx) {
      const values = i.isStringSelectMenu() ? i.values : [];
      const to = Number(args[0] ?? values[0] ?? 0);
      const move = (g: Game, now: number) => moveCursor(g, axis, to, now);
      await act(i, { ctx, d, queued: move }, move);
    },
  });

/** Every board control, given the jev deps. */
export const controls: ((d: PlayDeps) => ComponentHandler)[] = [
  cursor("row"),
  cursor("col"),
  control("dir", (_d, args) => (g, now) => setDir(g, args[0] === "down" ? "down" : "across", now)),
  control("place", () => placeShip),
  control("undo", () => undo),
  control("random", (d) => (g, now) => randomRest(g, d.random, now)),
  control("ready", (d) => (g, now) => ready(g, d.random, now)),
  control("fire", () => playerFire),
  control("resign", () => (g, now) => ({
    game: { ...g, updatedAt: now },
    outcome: { kind: "resigned" },
  })),
];
