import { playsOnTop, takeCards, takeUntilPlayable } from "./draw-pile.ts";
import { applyPlay } from "./effects.ts";
import { turnSeat } from "./guard.ts";
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

/** The board's line for a turn's draw. */
function drewLine(name: string, n: number): string {
  if (n === 0) return `${name} couldn't draw: no cards left`;

  return n === 1 ? `${name} drew a card` : `${name} drew ${n} cards`;
}

type DrawResult = "can-play" | "passed" | "took" | Refusal | "wrong-step";

/** Takes a waiting draw, or draws up to `max` cards until one plays: it may then be played ("can-play"), else the turn passes. */
function drawTurn(g: Game, a: Act, max: number): DrawResult {
  const seat = turnSeat(g, a);

  if (typeof seat === "string") return seat;

  const s = g.seats[seat];

  if (!s || g.step !== "play") return "wrong-step";

  s.idle = 0;

  if (g.pending) return takeWaiting(g, s, seat, a);

  const got = takeUntilPlayable(g, max, a.random);
  const c = got.at(-1);
  s.hand.push(...got);
  g.lastMove = drewLine(s.name, got.length);

  if (c && playsOnTop(g, c)) {
    g.step = "drawn";
    g.drawn = c;

    return "can-play";
  }

  passOn(g, seat, a.now);

  return "passed";
}

/** The Draw button: takes a waiting draw, or draws until a card plays. */
export const drawCards = (g: Game, a: Act): DrawResult => drawTurn(g, a, Number.POSITIVE_INFINITY);

/** A timeout's draw: takes a waiting draw, or draws a single card. */
export const drawOne = (g: Game, a: Act): DrawResult => drawTurn(g, a, 1);

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
  passOn(g, seat, a.now);

  return "passed";
}
