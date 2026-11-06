import type { TextStyle } from "./types.ts";

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export const esc = (s: string): string => s.replaceAll(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

export function text(s: string, t: TextStyle): string {
  const weight = t.bold ? ' font-weight="bold"' : "";
  const anchor = t.anchor ?? "middle";

  return `<text x="${t.x}" y="${t.y}" font-size="${t.size}" fill="${t.fill}" text-anchor="${anchor}"${weight}>${esc(s)}</text>`;
}

/** DejaVu Sans averages about this many ems per character (bold is wider). */
const EM_PER_CHAR = { plain: 0.6, bold: 0.68 } as const;

/** The largest size up to `max` at which `s` fits in `width`. */
export function fitSize(s: string, width: number, max: number, bold = false): number {
  const em = bold ? EM_PER_CHAR.bold : EM_PER_CHAR.plain;

  return Math.min(max, Math.floor(width / Math.max(1, s.length * em)));
}

/** A whole document; `scale` renders it larger for a sharper image. */
export function svgDoc(v: { width: number; height: number; scale?: number }, body: string): string {
  const s = v.scale ?? 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${v.width * s}" height="${v.height * s}" viewBox="0 0 ${v.width} ${v.height}" font-family="DejaVu Sans">${body}</svg>`;
}

/** Places a drawn block at (x, y), scaled. */
export const place = (body: string, at: { x: number; y: number; scale?: number }): string =>
  `<g transform="translate(${at.x} ${at.y}) scale(${at.scale ?? 1})">${body}</g>`;

/** The first letter of the first name and of the family name, e.g. "AS". */
export function initials(name: string, family: string): string {
  const given = name.slice(0, Math.max(0, name.length - family.length)).trim();

  return `${given.at(0) ?? ""}${family.at(0) ?? ""}`.toUpperCase();
}

/** The given names: the full name less the family name. */
export const givenName = (name: string, family: string): string =>
  name.endsWith(family) ? name.slice(0, name.length - family.length).trim() : name;

/** "1984–1994", or one year. */
export const years = (first: number, last: number): string =>
  first === last ? String(first) : `${first}–${last}`;

/** Splits after the hyphen or space nearest the middle; null when there is none. */
function halves(s: string): [string, string] | null {
  const cuts = [...s.matchAll(/[- ]/g)].map((m) => m.index);
  const mid = s.length / 2;
  const cut = cuts.toSorted((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];

  if (cut === undefined) return null;

  const keep = s[cut] === "-" ? cut + 1 : cut;

  return [s.slice(0, keep), s.slice(cut + 1)];
}

/** A family name on one line, or on two when one line would shrink it below 70 % of `max`. */
export function familyLines(
  family: string,
  width: number,
  max: number,
): { lines: string[]; size: number } {
  const one = fitSize(family, width, max, true);
  const two = halves(family);

  if (one >= max * 0.7 || !two) return { lines: [family], size: one };

  const longer = two[0].length > two[1].length ? two[0] : two[1];

  return { lines: two, size: Math.max(one, fitSize(longer, width, Math.round(max * 0.8), true)) };
}
