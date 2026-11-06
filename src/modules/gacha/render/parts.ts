import { MAX_LEVEL } from "../engine/constellation.ts";
import { CHIP, INK, MUTED, PANEL } from "./theme.ts";
import { text } from "./svg.ts";
import type { Colours } from "./types.ts";

/** A rounded label, centred on x. */
export function chip(
  label: string,
  v: { x: number; y: number; size: number; fill?: string; ink?: string },
): string {
  const w = Math.round(label.length * v.size * 0.72 + v.size);
  const h = Math.round(v.size * 1.5);
  const box = `<rect x="${v.x - w / 2}" y="${v.y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${v.fill ?? CHIP}"/>`;

  const ink = v.ink ?? INK;

  return box + text(label, { x: v.x, y: v.y + v.size * 0.36, size: v.size, fill: ink, bold: true });
}

/** The tier frame: a gradient card with a dark panel inset. */
export function frame(v: {
  w: number;
  h: number;
  tier: number;
  inset: number;
  best?: boolean;
}): string {
  const r = Math.round(v.w / 16);
  const outline = v.best ? ` stroke="${INK}" stroke-width="${Math.round(v.w / 40)}"` : "";

  return (
    `<rect width="${v.w}" height="${v.h}" rx="${r}" fill="url(#tier${v.tier})"${outline}/>` +
    `<rect x="${v.inset}" y="${v.inset}" width="${v.w - 2 * v.inset}" height="${v.h - 2 * v.inset}" rx="${r - v.inset / 2}" fill="${PANEL}"/>`
  );
}

/** A disc in the tier's gradient with the driver's initials. */
export function monogram(
  letters: string,
  v: { x: number; y: number; r: number; tier: number },
): string {
  const disc = `<circle cx="${v.x}" cy="${v.y}" r="${v.r}" fill="url(#tier${v.tier})"/>`;
  const ring = `<circle cx="${v.x}" cy="${v.y}" r="${v.r * 0.82}" fill="none" stroke="${PANEL}" stroke-opacity="0.35" stroke-width="${v.r / 14}"/>`;
  const size = Math.round(v.r * 0.85);

  return (
    disc + ring + text(letters, { x: v.x, y: v.y + size * 0.36, size, fill: PANEL, bold: true })
  );
}

/** Six pips, filled up to `level`, with "C3" after them; centred on x. */
export function pips(level: number, v: { x: number; y: number; r: number; c: Colours }): string {
  const step = v.r * 3;
  const label = `C${level}`;
  // The label starts 2.2 radii after the last pip and is about 3.6 radii wide.
  const gap = v.r * 2.2;
  const span = step * (MAX_LEVEL - 1) + gap + v.r * 3.6;
  const left = v.x - span / 2 + v.r / 2;
  const dots = Array.from({ length: MAX_LEVEL }, (_, i) => {
    const on = i < level;
    const fill = on ? v.c.accent : "none";

    return `<circle cx="${left + i * step}" cy="${v.y}" r="${v.r}" fill="${fill}" stroke="${on ? v.c.accent : MUTED}" stroke-width="${v.r / 3}"/>`;
  });
  const size = Math.round(v.r * 2.6);
  const at = { x: left + step * (MAX_LEVEL - 1) + gap, y: v.y + size * 0.36 };

  return dots.join("") + text(label, { ...at, size, fill: INK, bold: true, anchor: "start" });
}
