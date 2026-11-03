/** The object a JSON text holds, or null when it doesn't parse to one. */
function objectOf(text: string): object | null {
  try {
    const value: unknown = JSON.parse(text);

    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

/**
 * Parses the reply's JSON object into an uppercase-keyed map of string values: first `{` to the
 * last `}` (clues may contain braces), else to the first `}` (text after the object).
 */
export function parseClues(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const start = text.indexOf("{");

  if (start < 0) return out;

  const ends = [text.lastIndexOf("}"), text.indexOf("}", start)].filter((e) => e > start);
  const obj = ends.map((e) => objectOf(text.slice(start, e + 1))).find((o) => o !== null);

  for (const [key, value] of Object.entries(obj ?? {})) {
    if (typeof value === "string") out.set(key.toUpperCase(), value.trim());
  }

  return out;
}
