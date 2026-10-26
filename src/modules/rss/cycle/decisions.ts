import type { JevOutcome } from "./types.ts";
export const DAY_MS = 24 * 3_600_000;
const WARN_AT = 10;

/** Waiting items created before this expire. */
export function expiryCutoff(now: number): number {
  return now - DAY_MS;
}

/** The notice to post, given whether jev was down at the last notice. */
export function notice(wasDown: boolean, outcome: JevOutcome): "down" | "back" | null {
  if (outcome === "failed" && !wasDown) return "down";

  if (outcome === "ok" && wasDown) return "back";

  return null;
}

/** A feed's failure count after one fetch; `warn` is set on the 10th failure in a row only. */
export function feedResult(
  prev: { failures: number; warned: boolean },
  ok: boolean,
): { failures: number; warned: boolean; warn: boolean } {
  if (ok) return { failures: 0, warned: false, warn: false };

  const failures = prev.failures + 1;
  const warn = failures >= WARN_AT && !prev.warned;

  return { failures, warned: prev.warned || warn, warn };
}
