const BASE = 0x1f1e6;

/** The regional-indicator pair for a two-letter country code. */
export function flag(iso2: string): string {
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(BASE + c.charCodeAt(0) - 65))
    .join("");
}
