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

/** The public line for a ★5. */
export const fiveNews = (userId: string, d: Driver, l: Landed, kind: BannerKind): string =>
  `🏆 <@${userId}> pulled ★5 ${d.name} (C${l.level}) on the ${BANNER_NAME[kind].toLowerCase()}!`;
