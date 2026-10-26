import { asText, isRecord, records } from "../../../core/guards.ts";

/** A collection response's `data` items and `total`. */
export function collection(body: unknown): { data: Record<string, unknown>[]; total: number } {
  const b = isRecord(body) ? body : {};

  return { data: records(b["data"]), total: Number(asText(b["total"])) || 0 };
}
