import type { ChipKind, Weekend } from "./types.ts";
import type { MotorsportRepo } from "../repo.ts";
import type { SeriesKey, Viewer } from "../types.ts";
import { chipRefusal, usedElsewhere } from "./chip-rules.ts";
import { parseChip } from "./chips.ts";
import { rulesOf } from "./rules.ts";
import { loadWeekend } from "./weekend.ts";

/** Chips the viewer played on the season's other weekends. */
export const chipsUsed = (
  repo: MotorsportRepo,
  { userId }: Viewer,
  { series, event, season }: Weekend,
): Set<ChipKind> => usedElsewhere(repo.chips.season(series, season, userId), event.eventId);

/**
 * Plays the chip a select `value` names on the viewer's weekend ("none" clears it), until the
 * weekend locks. The refusal's text when it can't.
 */
export function saveChip(
  repo: MotorsportRepo,
  viewer: Viewer,
  { series, eventId }: { series: SeriesKey; eventId: string },
  value: string,
): string | null {
  const weekend = loadWeekend(repo, viewer, series, eventId);

  if (!weekend || !rulesOf(series).fantasy) return "That weekend has no chips.";

  const chosen = parseChip(value);
  const refusal = chipRefusal({
    chosen,
    used: chipsUsed(repo, viewer, weekend),
    locked: weekend.locked,
    open: weekend.open,
  });

  if (refusal) return refusal;

  if (!chosen) {
    repo.chips.clear(series, eventId, viewer.userId);

    return null;
  }

  repo.chips.set({ series, season: weekend.season, eventId }, viewer.userId, chosen, viewer.now);

  return null;
}
