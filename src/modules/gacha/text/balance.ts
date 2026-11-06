import { balanceOf } from "../engine/balance.ts";
import type { Ledger, Pity } from "../engine/types.ts";
import { amount, pityLine } from "./format.ts";

/** /gacha balance: the total, where it came from, and both banners' counters. */
export function balanceText(v: {
  ledger: Ledger;
  games: readonly { label: string; points: number }[];
  price: number;
  limited: Pity;
  standard: Pity;
}): string {
  const total = balanceOf(v.ledger);
  const games = v.games
    .filter((g) => g.points > 0)
    .map((g) => `${g.label} ${amount(g.points)}`)
    .join(" · ");

  return [
    `**Balance: ${amount(total)}** · ${amount(Math.floor(total / v.price))} pulls at ${amount(v.price)}`,
    `Earned **${amount(v.ledger.earned)}**${games ? ` — ${games}` : ""}`,
    `Spent ${amount(v.ledger.spent)} · Refunds ${amount(v.ledger.refunds)}`,
    "",
    `**Limited:** ${pityLine(v.limited, true)}`,
    `**Standard:** ${pityLine(v.standard, false)}`,
  ].join("\n");
}
