import { isRecord, records } from "../../../core/guards.ts";

/** A related entity of `type` in a MangaDex record's relationships. */
export function related(
  r: Record<string, unknown>,
  type: string,
): Record<string, unknown> | undefined {
  return records(r["relationships"]).find((rel) => rel["type"] === type);
}

/** The attributes of a related entity loaded through `includes[]`, or {}. */
export function relatedAttributes(
  r: Record<string, unknown>,
  type: string,
): Record<string, unknown> {
  const attributes = related(r, type)?.["attributes"];

  return isRecord(attributes) ? attributes : {};
}

/** A string, or null when absent or empty. */
export function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}
