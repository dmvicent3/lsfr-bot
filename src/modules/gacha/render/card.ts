import { chip, frame, monogram, pips } from "./parts.ts";
import { familyLines, fitSize, givenName, initials, text, years } from "./svg.ts";
import { INK, MUTED, TIER, stars } from "./theme.ts";
import type { CardView } from "./types.ts";

export const CARD = { w: 360, h: 500 } as const;

const STATS = [
  ["TITLES", "titles"],
  ["WINS", "wins"],
  ["POLES", "poles"],
] as const;

function header(v: CardView): string {
  const { tier, country } = v.driver;
  const c = TIER[tier];
  const row = text(stars(tier), { x: 30, y: 62, size: 34, fill: c.accent, anchor: "start" });
  const code = chip(country, { x: 302, y: 50, size: 22 });
  const tag = v.isNew ? chip("NEW", { x: 64, y: 92, size: 16, fill: c.dark }) : "";

  return row + code + tag;
}

function names(v: CardView): string {
  const { name, family, first, last } = v.driver;
  const given = givenName(name, family);
  const fam = familyLines(family, 300, 42);
  const two = fam.lines.length > 1;
  const lines = fam.lines.map((line, i) =>
    text(line, {
      x: 180,
      y: (two ? 304 : 318) + i * (fam.size + 2),
      size: fam.size,
      fill: INK,
      bold: true,
    }),
  );

  return (
    text(given, { x: 180, y: two ? 268 : 276, size: fitSize(given, 300, 24), fill: MUTED }) +
    lines.join("") +
    text(years(first, last), { x: 180, y: two ? 358 : 352, size: 21, fill: MUTED })
  );
}

function stats(v: CardView): string {
  return STATS.map(([label, key], i) => {
    const x = 72 + i * 108;
    const box = `<rect x="${x - 50}" y="372" width="100" height="72" rx="12" fill="#1f232b"/>`;
    const value = text(String(v.driver[key]), { x, y: 412, size: 32, fill: INK, bold: true });

    return box + value + text(label, { x, y: 434, size: 13, fill: MUTED, bold: true });
  }).join("");
}

/** A full card, 360 × 500, drawn at the origin. */
export function fullCard(v: CardView): string {
  const { tier, name, family } = v.driver;
  const level = v.level === null ? "" : pips(v.level, { x: 180, y: 472, r: 8, c: TIER[tier] });

  return (
    frame({ w: CARD.w, h: CARD.h, tier, inset: 12, ...(v.best ? { best: true } : {}) }) +
    header(v) +
    monogram(initials(name, family), { x: 180, y: 172, r: 66, tier }) +
    names(v) +
    stats(v) +
    level
  );
}
