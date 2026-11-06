import { chip, frame, monogram, pips } from "./parts.ts";
import { familyLines, fitSize, givenName, initials, text, years } from "./svg.ts";
import { INK, MUTED, PANEL, TIER, stars } from "./theme.ts";
import type { CardView } from "./types.ts";

export const MINI = { w: 200, h: 290 } as const;

function tags(v: CardView): string {
  const best = v.best ? chip("BEST", { x: 100, y: 0, size: 18, fill: INK, ink: PANEL }) : "";
  const fresh = v.isNew
    ? chip("NEW", { x: 100, y: 146, size: 14, fill: TIER[v.driver.tier].dark })
    : "";

  return best + fresh;
}

/** The given names, then the family name on one line or two; returns the text and where it ends. */
function names(v: CardView): { svg: string; end: number } {
  const { name, family } = v.driver;
  const given = givenName(name, family);
  const fam = familyLines(family, 180, 30);
  const top = fam.lines.length > 1 ? 200 : 206;
  const lines = fam.lines.map((line, i) =>
    text(line, { x: 100, y: top + i * (fam.size + 4), size: fam.size, fill: INK, bold: true }),
  );
  const svg =
    text(given, { x: 100, y: 176, size: fitSize(given, 176, 19), fill: MUTED }) + lines.join("");

  return { svg, end: top + (fam.lines.length - 1) * (fam.size + 4) };
}

/** A compact card, 200 × 290, for the 10-pull and the banner: big name, few details. */
export function miniCard(v: CardView): string {
  const { tier, name, family, country, first, last } = v.driver;
  const c = TIER[tier];
  const named = names(v);
  const level = v.level === null ? "" : pips(v.level, { x: 100, y: 268, r: 6, c });
  const meta = `${country} · ${years(first, last)}`;

  return (
    frame({ w: MINI.w, h: MINI.h, tier, inset: 8, ...(v.best ? { best: true } : {}) }) +
    text(stars(tier), { x: 100, y: 44, size: 28, fill: c.accent }) +
    monogram(initials(name, family), { x: 100, y: 106, r: 38, tier }) +
    named.svg +
    text(meta, { x: 100, y: Math.max(234, named.end + 26), size: 17, fill: MUTED }) +
    level +
    tags(v)
  );
}
