import { isRecord } from "../../../core/guards.ts";

/** Values fast-xml-parser hands back, as plain text. */

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

const MAX_CODE_POINT = 0x10ffff;

/** "#x41" or "#65" as its character; null when it isn't a valid code point. */
function numeric(code: string): string | null {
  const hex = code[1] === "x" || code[1] === "X";
  const n = hex ? parseInt(code.slice(2), 16) : Number(code.slice(1));
  return Number.isFinite(n) && n > 0 && n <= MAX_CODE_POINT ? String.fromCodePoint(n) : null;
}

function decodeEntities(s: string): string {
  return s.replaceAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    const decoded = code.startsWith("#") ? numeric(code) : NAMED[code.toLowerCase()];
    return decoded ?? whole;
  });
}

/** HTML or text as one line of plain text. */
export function plain(html: string): string {
  const noTags = html
    .replaceAll(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replaceAll(/<[^>]*>/g, " ");
  return decodeEntities(decodeEntities(noTags)).replaceAll(/\s+/g, " ").trim();
}

/** An element's text: a string, a number, or `{"#text": …}` when it has attributes. */
export function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (isRecord(value)) return text(value["#text"]);
  return "";
}

export function attr(value: unknown, name: string): string {
  return isRecord(value) ? text(value[`@_${name}`]) : "";
}

export function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

export function date(value: unknown): number | null {
  const s = text(value).trim();
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

export function orNull(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}
