import { isWild } from "./deck.ts";
import type { Card, Colour, Pending } from "./types.ts";

/**
 * Whether `card` may go on `top`. A waiting draw takes only the same draw card; otherwise the
 * colour to match (the picked one after a Paint; none yet after a first-card Paint), the same
 * value or symbol, or a wild.
 */
export function isLegal(
  card: Card,
  top: Card,
  colour: Colour | null,
  pending: Pending | null,
): boolean {
  if (pending) return card.value === pending.kind;

  if (isWild(card) || colour === null) return true;

  return card.colour === colour || card.value === top.value;
}
