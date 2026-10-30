import { matches } from "../match.ts";
import { KAOS_POINTS } from "../scoring.ts";
import type { KaosItem, KaosList } from "../types.ts";
import type { Answer, Award, KaosRound } from "./types.ts";

export const KAOS_HINT_MS = 30_000;
export const KAOS_MS = 60_000;

export const kaosStart = (list: KaosList, id: string, now: number): KaosRound => ({
  kind: "kaos",
  id,
  list,
  startedAt: now,
  claims: list.items.map(() => null),
  hinted: false,
  closedAt: null,
});

const accepts = (item: KaosItem, text: string): boolean =>
  [item.answer, ...(item.aliases ?? [])].some((a) => matches(text, a));

/** The hint at 30 s, the close at 60 s. */
export function kaosTick(r: KaosRound, now: number): KaosRound {
  if (r.closedAt !== null) return r;

  const elapsed = now - r.startedAt;

  if (elapsed >= KAOS_MS) return { ...r, closedAt: now };

  return !r.hinted && elapsed >= KAOS_HINT_MS ? { ...r, hinted: true } : r;
}

/** Claims the first open item the message names; the last claim closes the round. */
export function kaosAnswer(r: KaosRound, a: Answer): { round: KaosRound; claimed: number | null } {
  if (kaosTick(r, a.at).closedAt !== null) return { round: r, claimed: null };

  const index = r.list.items.findIndex((item, i) => r.claims[i] === null && accepts(item, a.text));

  if (index < 0) return { round: r, claimed: null };

  const claims = r.claims.map((c, i) => (i === index ? { userId: a.userId, at: a.at } : c));
  const closedAt = claims.every((c) => c !== null) ? a.at : null;

  return { round: { ...r, claims, closedAt }, claimed: index };
}

export function kaosAwards(r: KaosRound): Award[] {
  return r.claims.flatMap((c, itemIndex) =>
    c ? [{ userId: c.userId, points: KAOS_POINTS, ms: c.at - r.startedAt, itemIndex }] : [],
  );
}
