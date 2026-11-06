import { asText, isRecord } from "../../../core/guards.ts";

/** A user's display name, then username, then the fallback. */
export function userName(user: unknown, fallback: string): string {
  if (!isRecord(user)) return fallback;

  return asText(user.global_name) || asText(user.username) || fallback;
}
