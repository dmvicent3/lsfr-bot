/** Parses the first {...} block of a reply into an uppercase-keyed map of string values. */
export function parseClues(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const start = text.indexOf("{");
  const end = text.indexOf("}", start);

  if (start < 0 || end < 0) {
    return out;
  }

  try {
    const obj: unknown = JSON.parse(text.slice(start, end + 1));

    for (const [key, value] of Object.entries(obj ?? {})) {
      if (typeof value === "string") {
        out.set(key.toUpperCase(), value.trim());
      }
    }
  } catch {
    // unparseable reply: caller falls back to definitions
  }

  return out;
}
