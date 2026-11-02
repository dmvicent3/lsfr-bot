const BASE = 0x1f1e6;
// Codes in the snapshot that have no Unicode flag emoji (Kosovo).
const NO_FLAG = new Set(["XK"]);

/** The regional-indicator pair for a two-letter country code. */
export function flag(iso2: string): string {
  const code = iso2.toUpperCase();

  if (NO_FLAG.has(code)) return "🏳️";

  return code
    .split("")
    .map((c) => String.fromCodePoint(BASE + c.charCodeAt(0) - 65))
    .join("");
}
