import { isWild } from "./deck.ts";
import { takeCards } from "./draw-pile.ts";
import { settle } from "./finish.ts";
import { cardLabel } from "./label.ts";
import { active, beginTurn, nextSeat } from "./order.ts";
import type { Act, Card, Game, Value } from "./types.ts";

/** The click's clock, and whether "+ Last card!" came with it. */
type Clock = Pick<Act, "now" | "random"> & { last?: boolean };

/** What went down: one value, n copies. */
interface Played {
  value: Value;
  n: number;
}

/** A +2 / Paint +4: added to the waiting draw (stacking), or drawn at once by the next player. */
function drawEffect(g: Game, seat: number, p: Played, c: Clock): number {
  const kind = p.value === "paint4" ? "paint4" : "plus2";
  const amount = (kind === "plus2" ? 2 : 4) * p.n;

  if (g.stacking) {
    g.pending = { kind, total: (g.pending?.total ?? 0) + amount };

    return nextSeat(g, seat);
  }

  g.seats[nextSeat(g, seat)]?.hand.push(...takeCards(g, amount, c.random));

  return nextSeat(g, seat, 2);
}

/** Applies `n` copies of `value` played from `seat`; the seat whose turn is next. */
function nextAfter(g: Game, seat: number, p: Played, c: Clock): number {
  const { value, n } = p;

  if (value === "block") return nextSeat(g, seat, 1 + n);

  if (value === "turn" && active(g).length === 2) return nextSeat(g, seat, 1 + n);

  if (value === "turn") {
    if (n % 2 === 1) g.direction = g.direction === 1 ? -1 : 1;

    return nextSeat(g, seat);
  }

  if (value === "plus2" || value === "paint4") return drawEffect(g, seat, p, c);

  return nextSeat(g, seat);
}

function describe(g: Game, seat: number, cards: Card[], first: Card): void {
  const s = g.seats[seat];
  const times = cards.length > 1 ? ` ×${cards.length}` : "";
  const out = s && s.hand.length === 0 ? " and is out!" : "";
  g.lastMove = `${s?.name ?? "?"} played ${cardLabel(first)}${times}${out}`;
}

/**
 * After cards leave a hand: onto the pile, places settled, each copy's effect, then the next turn.
 * A wild waits for its colour (step "paint") unless its player just went out.
 */
export function applyPlay(
  g: Game,
  seat: number,
  cards: Card[],
  c: Clock,
): "played" | "pick-colour" {
  const first = cards[0];

  if (!first) return "played";

  const s = g.seats[seat];

  if (s) {
    s.idle = 0;
    s.catchable = s.hand.length === 1 && c.last !== true;
  }

  g.discard.push(...cards);
  describe(g, seat, cards, first);
  settle(g);

  if (g.phase === "over") return "played";

  const out = g.seats[seat]?.place !== null;
  const next = nextAfter(g, seat, { value: first.value, n: cards.length }, c);

  if (isWild(first) && !out) {
    g.step = "paint";
    g.afterPaint = next;

    return "pick-colour";
  }

  g.colour = first.colour;
  beginTurn(g, next, c.now);

  return "played";
}
