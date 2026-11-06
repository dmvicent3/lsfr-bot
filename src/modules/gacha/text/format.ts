import { flag } from "../../../core/countries/flag.ts";
import { FIVE, FOUR } from "../engine/rates.ts";
import type { BannerKind, Pity } from "../engine/types.ts";
import { stars } from "../render/theme.ts";
import type { Driver } from "../types.ts";

export const BANNER_NAME: Record<BannerKind, string> = {
  limited: "Limited banner",
  standard: "Standard banner",
};

/** 12,345 */
export const amount = (n: number): string => n.toLocaleString("en-US");

/** "★★★★★ 🇧🇷 Ayrton Senna", the name bold. */
export const driverLine = (d: Driver): string =>
  `${stars(d.tier)} ${flag(d.country)} **${d.name}**`;

/** "3 titles · 41 wins · 65 poles", leaving out what is 0. */
export function record(d: Driver): string {
  const parts = [
    [d.titles, "title"],
    [d.wins, "win"],
    [d.poles, "pole"],
  ] as const;
  const said = parts.filter(([n]) => n > 0).map(([n, w]) => `${n} ${w}${n === 1 ? "" : "s"}`);

  return said.length > 0 ? said.join(" · ") : `${d.starts} starts`;
}

/** "★5 pity 23/90 · ★4 3/10", with the guarantees on the limited banner. */
export function pityLine(p: Pity, limited: boolean): string {
  const counts = `★5 pity ${p.five}/${FIVE.hard} · ★4 ${p.four}/${FOUR.hard}`;

  if (!limited) return counts;

  const five = p.guaranteeFive ? "next ★5 featured (guaranteed)" : "next ★5 is a 50/50";
  const four = p.guaranteeFour ? "next ★4 featured (guaranteed)" : "next ★4 is a 50/50";

  return `${counts} · ${five} · ${four}`;
}

export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;
