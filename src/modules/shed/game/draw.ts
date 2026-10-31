import { takeCards } from "./draw-pile.ts";
import { applyPlay } from "./effects.ts";
import { turnSeat } from "./guard.ts";
import { isLegal } from "./legal.ts";
import { beginTurn, nextSeat } from "./order.ts";
import type { Act, Game, Refusal, Seat } from "./types.ts";

const passOn = (g: Game, seat: number, now: number): void => beginTurn(g, nextSeat(g, seat), now);

/** The waiting draw, all of it; the turn is lost. */
function takeWaiting(g: Game, s: Seat, seat: number, a: Act): "took" {
  const got = takeCards(g, g.pending?.total ?? 0, a.random);
  s.hand.push(...got);
  g.lastMove = `${s.name} drew ${got.length}`;
  g.pending = null;
  passOn(g, seat, a.now);

  return "took";
}

/** Draw: takes a waiting draw, or draws one card that may then be played ("can-play") or passes. */
export function drawOne(g: Game, a: Act): "can-play" | "passed" | "took" | Refusal | "wrong-step" {
  const seat = turnSeat(g, a);

  if (typeof seat === "string") return seat;

  const s = g.seats[seat];

  if (!s || g.step !== "play") return "wrong-step";

  s.idle = 0;

  if (g.pending) return takeWaiting(g, s, seat, a);

  const [c] = takeCards(g, 1, a.random);
  const top = g.discard.at(-1);

  if (c) s.hand.push(c);

  if (c && top && isLegal(c, top, g.colour, null)) {
    g.step = "drawn";
    g.drawn = c;

    return "can-play";
  }

  g.lastMove = `${s.name} drew a card`;
  passOn(g, seat, a.now);

  return "passed";
}

/** "Play it": the card just drawn goes down. */
export function keepDrawn(
  g: Game,
  a: Act & { last: boolean },
): "played" | "pick-colour" | Refusal | "wrong-step" {
  const seat = turnSeat(g, a);

  if (typeof seat === "string") return seat;

  const s = g.seats[seat];
  const c = g.drawn;

  if (!s || g.step !== "drawn" || !c) return "wrong-step";

  s.hand = s.hand.filter((x) => x.id !== c.id);
  g.drawn = null;
  g.step = "play";

  return applyPlay(g, seat, [c], a);
}

/** "Pass": keeps the drawn card, the turn moves on. */
export function passDrawn(g: Game, a: Act): "passed" | Refusal | "wrong-step" {
  const seat = turnSeat(g, a);

  if (typeof seat === "string") return seat;

  const s = g.seats[seat];

  if (!s || g.step !== "drawn") return "wrong-step";

  s.idle = 0;
  g.lastMove = `${s.name} drew a card`;
  passOn(g, seat, a.now);

  return "passed";
}
