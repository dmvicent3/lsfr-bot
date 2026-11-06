import { balanceOf } from "../engine/balance.ts";
import type { FiftyFifty, Ledger, Pity } from "../engine/types.ts";
import { amount, pityLine } from "./format.ts";

/** "won 3 in a row · best 3 won, 2 lost · 5W–2L"; null before the first 50/50. */
function fiftyLine(f: FiftyFifty): string | null {
  if (!f.current) return null;

  const { coin, run } = f.current;
  const now = run >= 2 ? `${coin} ${run} in a row` : `${coin} the last one`;

  return `**50/50:** ${now} · best ${f.best.won} won, ${f.best.lost} lost · ${f.count.won}W–${f.count.lost}L`;
}

/** /gacha balance: the total, where it came from, both banners' counters and the 50/50 record. */
export function balanceText(v: {
  ledger: Ledger;
  games: readonly { label: string; points: number }[];
  price: number;
  limited: Pity;
  standard: Pity;
  fifty: FiftyFifty;
}): string {
  const total = balanceOf(v.ledger);
  const games = v.games
    .filter((g) => g.points > 0)
    .map((g) => `${g.label} ${amount(g.points)}`)
    .join(" · ");
  const fifty = fiftyLine(v.fifty);

  return [
    `**Balance: ${amount(total)}** · ${amount(Math.floor(total / v.price))} pulls at ${amount(v.price)}`,
    `Earned **${amount(v.ledger.earned)}**${games ? ` — ${games}` : ""}`,
    `Spent ${amount(v.ledger.spent)} · Refunds ${amount(v.ledger.refunds)}`,
    "",
    `**Limited:** ${pityLine(v.limited, true)}`,
    ...(fifty ? [fifty] : []),
    `**Standard:** ${pityLine(v.standard, false)}`,
  ].join("\n");
}
