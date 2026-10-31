import { newGame, seat } from "../../../../src/modules/shed/game/new.ts";
import { beginTurn } from "../../../../src/modules/shed/game/order.ts";
import type { Act, Card, Colour, Game } from "../../../../src/modules/shed/game/types.ts";
import { card } from "./cards.ts";
import { seeded } from "./random.ts";

/**
 * A game already playing: seats u1, u2, … holding `hands`, `top` face up, 20 green 3s to draw,
 * u1's turn (turnNo 1). Stacking on unless told otherwise.
 */
export function table(
  hands: Card[][],
  top: Card,
  o: { stacking?: boolean; colour?: Colour | null } = {},
): Game {
  const g = newGame({
    id: 1,
    guildId: "g",
    channelId: "c",
    starter: { userId: "u1", name: "P1" },
    stacking: o.stacking ?? true,
    now: 0,
  });
  g.seats = hands.map((hand, i) => ({ ...seat({ userId: `u${i + 1}`, name: `P${i + 1}` }), hand }));
  g.phase = "playing";
  g.discard = [top];
  g.colour = o.colour === undefined ? top.colour : o.colour;
  g.draw = Array.from({ length: 20 }, () => card("green", "3"));
  beginTurn(g, 0, 0);

  return g;
}

/** A click by `userId` on the current turn. */
export const act = (g: Game, userId: string): Act => ({
  userId,
  turnNo: g.turnNo,
  now: 0,
  random: seeded(1),
});

export const hand = (g: Game, userId: string): Card[] =>
  g.seats.find((s) => s.userId === userId)?.hand ?? [];

export const turnOf = (g: Game): string | undefined => g.seats[g.turn]?.userId;
