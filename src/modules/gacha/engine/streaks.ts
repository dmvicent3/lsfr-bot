import type { Coin, FiftyFifty } from "./types.ts";

/**
 * The 50/50s behind a player's limited ★5s (whether each was featured, oldest first). The ★5
 * right after a lost 50/50 was guaranteed, so it rolled none and is skipped.
 */
export function coinsOf(featured: readonly boolean[]): Coin[] {
  const coins: Coin[] = [];
  let guaranteed = false;

  for (const f of featured) {
    if (guaranteed) {
      guaranteed = false;
      continue;
    }

    coins.push(f ? "won" : "lost");
    guaranteed = !f;
  }

  return coins;
}

/** The current run, the best runs and the totals of a list of 50/50s. */
export function fiftyFifty(coins: readonly Coin[]): FiftyFifty {
  const best = { won: 0, lost: 0 };
  const count = { won: 0, lost: 0 };
  let current: FiftyFifty["current"] = null;

  for (const coin of coins) {
    const run: number = current?.coin === coin ? current.run + 1 : 1;
    current = { coin, run };
    best[coin] = Math.max(best[coin], run);
    count[coin] += 1;
  }

  return { current, best, count };
}
