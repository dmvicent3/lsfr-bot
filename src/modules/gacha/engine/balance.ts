import type { Ledger } from "./types.ts";

export const balanceOf = (l: Ledger): number => l.earned + l.refunds - l.spent;

/** Pull prices a server may set. */
export const PRICE_RANGE = { min: 1, max: 100_000 } as const;

/** What `count` pulls cost, or null when the balance can't cover them. */
export function costOf(l: Ledger, price: number, count: number): number | null {
  const cost = price * count;

  return balanceOf(l) >= cost ? cost : null;
}
