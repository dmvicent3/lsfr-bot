import { COLOURS } from "./deck.ts";
import { settle } from "./finish.ts";
import { beginTurn, nextSeat } from "./order.ts";
import type { Card, Colour, Game } from "./types.ts";

/** The colour a hand holds most of; ties go red, yellow, green, blue. */
export function mostHeld(hand: Card[]): Colour {
  const count = (c: Colour): number => hand.filter((x) => x.colour === c).length;

  return COLOURS.reduce((best, c) => (count(c) > count(best) ? c : best), COLOURS[0] ?? "red");
}

/** With `seat` gone: where a pending Paint pick sends the turn (theirs), or the skip kept (someone else's). */
function redirectPaint(g: Game, seat: number, theirTurn: boolean): number | null {
  const after = g.afterPaint;

  if (theirTurn) {
    g.afterPaint = null;

    return after !== null && after !== seat ? after : null;
  }

  if (after === seat) g.afterPaint = nextSeat(g, seat);

  return null;
}

/**
 * Takes a seat out with no place: its cards go under the draw pile, a waiting draw stays for the next
 * player, and the turn passes if it was theirs (a Paint mid-pick gets their most-held colour).
 */
export function dropSeat(g: Game, seat: number, now: number): void {
  const s = g.seats[seat];

  if (!s) return;

  const theirTurn = seat === g.turn;

  if (theirTurn && g.step === "paint") g.colour = mostHeld(s.hand);

  g.draw.unshift(...s.hand);
  s.hand = [];
  s.dropped = true;
  s.catchable = false;
  const after = redirectPaint(g, seat, theirTurn);
  settle(g);

  if (g.phase !== "playing" || !theirTurn) return;

  beginTurn(g, after ?? nextSeat(g, seat), now);
}

/** The Leave button: out of the game, no place. */
export function quitGame(g: Game, userId: string, now: number): "left" | "not-in" | "over" {
  if (g.phase !== "playing") return "over";

  const i = g.seats.findIndex((s) => s.userId === userId);
  const s = g.seats[i];

  if (!s || s.dropped || s.place !== null) return "not-in";

  dropSeat(g, i, now);
  g.lastMove = `${s.name} left the game`;

  return "left";
}
