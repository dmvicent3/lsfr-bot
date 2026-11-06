import type { Landed, Roll, Tier } from "./types.ts";

/** C0 on the first copy, one level a copy after it, up to C6 (7 copies). */
export const MAX_LEVEL = 6;
export const MAX_COPIES = MAX_LEVEL + 1;
/** What a copy past C6 gives back, in pulls' worth: half the tier's average cost (★5 ~80, ★4 10, ★3 1). */
export const REFUND_PULLS: Record<Tier, number> = { 5: 40, 4: 5, 3: 0.5 };

/** The constellation level for a number of copies held (at least one). */
export const levelOf = (copies: number): number => Math.min(Math.max(copies, 1), MAX_COPIES) - 1;

/** The currency a copy past C6 gives back at `price` a pull, in whole units. */
export const refundFor = (tier: Tier, price: number): number =>
  Math.round(REFUND_PULLS[tier] * price);

/** Counts each roll's copy in turn (a 10-pull can draw one driver twice); returns the copies after. */
export function landCopies(
  held: ReadonlyMap<string, number>,
  rolls: readonly Roll[],
  price: number,
): { landed: Landed[]; copies: Map<string, number> } {
  const copies = new Map(held);
  const landed = rolls.map((roll): Landed => {
    const before = copies.get(roll.driverId) ?? 0;
    const full = before >= MAX_COPIES;
    const after = full ? before : before + 1;
    copies.set(roll.driverId, after);

    return {
      ...roll,
      level: levelOf(after),
      isNew: before === 0,
      refund: full ? refundFor(roll.tier, price) : 0,
    };
  });

  return { landed, copies };
}
