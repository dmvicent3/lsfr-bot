import { FLAG_COLOURS } from "../../src/core/countries/facts.ts";
import type { FlagColour } from "../../src/core/countries/types.ts";

const NAMED: Record<string, string> = {
  red: "#ff0000",
  crimson: "#dc143c",
  blue: "#0000ff",
  navy: "#000080",
  green: "#008000",
  yellow: "#ffff00",
  gold: "#ffd700",
  orange: "#ffa500",
  white: "#ffffff",
  black: "#000000",
};
const PAINT =
  /(?:fill|stroke|stop-color)\s*[:=]\s*["']?\s*(#[0-9a-f]{3,8}\b|rgb\([^)]*\)|[a-z]+)/gi;

function channels(colour: string): [number, number, number] | null {
  const text = NAMED[colour.toLowerCase()] ?? colour;
  const rgb = /^rgb\(\s*([\d.]+)(%?)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/i.exec(text);

  if (rgb) {
    const k = rgb[2] === "%" ? 2.55 : 1;

    return [Number(rgb[1]) * k, Number(rgb[3]) * k, Number(rgb[4]) * k];
  }

  const hex = /^#([0-9a-f]{3,8})$/i.exec(text)?.[1];

  if (hex === undefined || ![3, 4, 6, 8].includes(hex.length)) return null;

  const full = hex.length <= 4 ? hex.replace(/./g, "$&$&") : hex;
  const part = (i: number) => parseInt(full.slice(i, i + 2), 16);

  return [part(0), part(2), part(4)];
}

function hueSector([R, G, B]: [number, number, number], max: number, d: number): number {
  if (max === R) return ((G - B) / d + 6) % 6;

  return max === G ? (B - R) / d + 2 : (R - G) / d + 4;
}

function hsl([r, g, b]: [number, number, number]): { h: number; s: number; l: number } {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = d / (1 - Math.abs(2 * l - 1));
  const sector = hueSector([R, G, B], max, d);

  return { h: sector * 60, s, l };
}

const HUES: [number, FlagColour | null][] = [
  [15, "red"],
  [40, "orange"],
  [70, "yellow"],
  [170, "green"],
  [260, "blue"],
  [335, null],
  [361, "red"],
];

/** White and black by lightness; null for greys; undefined when the hue decides. */
function neutral(s: number, l: number): FlagColour | null | undefined {
  if (l >= 0.9 || (l >= 0.8 && s < 0.15)) return "white";

  if (l < 0.1 || (l < 0.16 && s < 0.3)) return "black";

  return s < 0.2 ? null : undefined;
}

/** Brown is dark orange and pink is pale red; neither is a flag colour. */
const muddy = (family: FlagColour | null, l: number) =>
  (family === "orange" && l < 0.38) || (family === "red" && l > 0.8);

/** The flag colour family of a colour (white/black by lightness, others by hue); null for greys, browns, purples. */
export function familyOf(colour: string): FlagColour | null {
  const rgb = channels(colour);

  if (!rgb) return null;

  const { h, s, l } = hsl(rgb);
  const plain = neutral(s, l);

  if (plain !== undefined) return plain;

  const family = HUES.find(([max]) => h < max)?.[1] ?? null;

  return muddy(family, l) ? null : family;
}

/** Distinct colour families used by an SVG's fill and stroke values, in the canonical order. */
export function coloursFromSvg(svg: string): FlagColour[] {
  const found = new Set<FlagColour>();

  for (const match of svg.matchAll(PAINT)) {
    const family = familyOf(match[1] ?? "");

    if (family) found.add(family);
  }

  return FLAG_COLOURS.filter((c) => found.has(c));
}
