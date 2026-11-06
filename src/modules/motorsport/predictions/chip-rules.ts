import type { Chip, ChipKind, PlayedChip } from "./types.ts";
import type { Session } from "../types.ts";
import { CHIPS } from "./chips.ts";

/** Chips the player played on other weekends of the season: each is once a season. */
export const usedElsewhere = (season: readonly PlayedChip[], eventId: string): Set<ChipKind> =>
  new Set(season.filter((c) => c.eventId !== eventId).map((c) => c.chip.kind));

/**
 * Why a chip choice (null = clear it) can't go through, or null when it can: chips freeze at
 * the weekend lock, each is once a season, and Triple Pick marks an open session.
 */
export function chipRefusal(v: {
  chosen: Chip | null;
  used: ReadonlySet<ChipKind>;
  locked: boolean;
  open: readonly Session[];
}): string | null {
  const { chosen } = v;

  if (v.locked) return "🔒 The weekend is locked: chips froze at its first session.";

  if (!chosen) return null;

  if (v.used.has(chosen.kind)) {
    return `You already played ${CHIPS[chosen.kind].name} this season: each chip is once a season.`;
  }

  if (chosen.kind === "triple" && !v.open.some((s) => s.sessionId === chosen.sessionId)) {
    return "That session isn't open for predictions.";
  }

  return null;
}
