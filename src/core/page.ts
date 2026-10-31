import type { FetchFn } from "./types.ts";

const TIMEOUT_MS = 8000;
/** Characters of HTML read; a results page has its table well before this. */
const MAX_CHARS = 1_000_000;
const UA = "Mozilla/5.0 (compatible; Gork Discord bot)";

const DROP = /<(script|style|noscript|head|svg|template)\b[\s\S]*?<\/\1>/gi;
const CELL_END = /<\/t[dh]>\s*(?=<t[dh]\b)/gi;
const BREAK =
  /<\/?(br|p|div|h[1-6]|li|tr|table|section|article|nav|header|footer|ul|ol|main)\b[^>]*>/gi;
const TAG = /<[^>]*>/g;
/** A `"key":{` or `"key":"` left from data embedded in the page, not text anyone reads. */
const JSON_BIT = /"\s*:\s*[{["]/;
/** Accents stacked on one letter: decoration ("zalgo" titles), shown as noise in Discord. */
const STACKED_MARKS = /\p{M}{2,}/gu;
const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decode(text: string): string {
  return text.replaceAll(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name.startsWith("#x") || name.startsWith("#X"))
      return String.fromCodePoint(Number.parseInt(name.slice(2), 16));

    if (name.startsWith("#")) return String.fromCodePoint(Number(name.slice(1)));

    return NAMED[name.toLowerCase()] ?? whole;
  });
}

/** A page's readable text, one block per line; table rows read as "cell | cell". */
export function pageText(html: string): string {
  const flat = html
    .replaceAll(DROP, "")
    .replaceAll(CELL_END, " | ")
    .replaceAll(BREAK, "\n")
    .replaceAll(TAG, "");

  return decode(flat)
    .replaceAll(STACKED_MARKS, "")
    .split("\n")
    .map((line) => line.replaceAll(/\s+/g, " ").trim())
    .filter((line) => line !== "" && !JSON_BIT.test(line))
    .join("\n");
}

/** A web page's text; throws on a refusal or anything that isn't HTML. */
export async function readPage(url: string, fetchFn: FetchFn = fetch): Promise<string> {
  const res = await fetchFn(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": UA },
  });

  if (!res.ok) throw new Error(`page returned ${res.status}`);

  const type = res.headers.get("content-type") ?? "";

  if (!type.includes("html")) throw new Error(`page is ${type || "untyped"}`);

  return pageText((await res.text()).slice(0, MAX_CHARS));
}
