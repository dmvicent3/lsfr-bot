export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** A string or number as text; anything else as "". */
export function asText(value: unknown): string {
  if (typeof value === "string") return value;

  return typeof value === "number" ? String(value) : "";
}

/** The records in an array; anything else as []. */
export function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as unknown[]).filter(isRecord) : [];
}
