import { turnSeat } from "./guard.ts";
import { colourEmoji } from "./label.ts";
import { beginTurn, nextSeat } from "./order.ts";
import type { Act, Colour, Game, Refusal } from "./types.ts";

/** The colour after a Paint; then the turn the Paint's effects pointed at starts. */
export function pickColour(
  g: Game,
  a: Act & { colour: Colour },
): "picked" | Refusal | "wrong-step" {
  const seat = turnSeat(g, a);

  if (typeof seat === "string") return seat;

  if (g.step !== "paint") return "wrong-step";

  g.colour = a.colour;
  g.lastMove = `${g.lastMove} → ${colourEmoji(a.colour)}`;
  const next = g.afterPaint ?? nextSeat(g, seat);
  g.afterPaint = null;
  beginTurn(g, next, a.now);

  return "picked";
}
