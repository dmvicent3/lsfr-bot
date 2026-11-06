import type { BannerKind, Landed, Pity } from "../engine/types.ts";
import type { Driver } from "../types.ts";
import { BANNER_NAME, amount, driverLine, pityLine, plural } from "./format.ts";

function pullLine(l: Landed, d: Driver): string {
  const marks = [
    `C${l.level}`,
    ...(l.isNew ? ["new"] : []),
    ...(l.featured ? ["featured"] : []),
    ...(l.lost ? ["lost the 50/50"] : []),
    ...(l.refund > 0 ? [`past C6: +${amount(l.refund)} back`] : []),
  ];

  return `${driverLine(d)} · ${marks.join(" · ")}`;
}

/** The private pull reply: each card (show order), the counters and the balance. */
export function pullText(v: {
  kind: BannerKind;
  shown: readonly { landed: Landed; driver: Driver }[];
  pity: Pity;
  cost: number;
  balance: number;
}): string {
  const head = `**${plural(v.shown.length, "pull")} · ${BANNER_NAME[v.kind]}** (−${amount(v.cost)})`;
  const lines = v.shown.map((s) => pullLine(s.landed, s.driver));
  const pity = pityLine(v.pity, v.kind === "limited");

  return [head, ...lines, "", pity, `Balance: **${amount(v.balance)}**`].join("\n");
}

/** Said when the balance can't pay. */
export const shortText = (v: { balance: number; cost: number; price: number }): string =>
  `That costs ${amount(v.cost)} and your balance is ${amount(v.balance)} (one pull is ${amount(v.price)}). Points from every game add to it: play a daily!`;

/** How a limited ★5 went: guaranteed, or the 50/50 won or lost. */
function fiftyFifty(l: Landed, run: number): string {
  if (l.guaranteed) return "guaranteed after a lost 50/50";

  const streak = run >= 2 ? ` (${run} in a row)` : "";

  return l.lost
    ? `lost the 50/50${streak}, so the next ★5 is guaranteed`
    : `won the 50/50${streak}`;
}

/**
 * The public line for a ★5: the banner, how many pulls it took and, on a limited, the 50/50 with
 * its streak (`run`: how many 50/50s in a row ended this way).
 */
export function fiveNews(v: {
  userId: string;
  driver: Driver;
  landed: Landed;
  kind: BannerKind;
  run?: number | undefined;
}): string {
  const { userId, driver: d, landed: l, kind, run = 1 } = v;
  const head = `🏆 <@${userId}> pulled ★5 ${d.name} (C${l.level}) on the ${BANNER_NAME[kind].toLowerCase()} after ${plural(l.pulls, "pull")}`;

  return kind === "limited" ? `${head} · ${fiftyFifty(l, run)}!` : `${head}!`;
}
