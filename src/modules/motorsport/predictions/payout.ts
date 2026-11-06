import type { Chip, EntryScore, PlayedChip, SeasonEntry, Standing } from "./types.ts";
import type { SeriesKey } from "../types.ts";
import { chipApplies, chipPoints } from "./chips.ts";
import { rulesOf } from "./rules.ts";
import { pickScores } from "./scoring.ts";

/** The most a session's prediction scores before chips; it pays the session's full pulls. */
const MAX_POINTS = 20;

const chipKey = (userId: string, eventId: string): string => `${userId}/${eventId}`;

/** Chips by player and weekend, for looking up the chip of a prediction. */
export const chipsByWeekend = (chips: readonly PlayedChip[]): ReadonlyMap<string, Chip> =>
  new Map(chips.map((c) => [chipKey(c.userId, c.eventId), c.chip]));

/** Points after the weekend's chip, and the pulls they pay: session max × points / 20. */
export function scoreEntry(
  series: SeriesKey,
  entry: SeasonEntry,
  chips: ReadonlyMap<string, Chip>,
): EntryScore {
  const owned = chips.get(chipKey(entry.userId, entry.eventId));
  const chip = owned && chipApplies(owned, entry.sessionId, entry.kind) ? owned : null;
  const scores = pickScores(entry.picks, entry.rows);
  const points = chipPoints(scores, chip ? [chip] : []);
  const max = rulesOf(series).pulls[entry.kind] ?? 0;

  return { points, perfect: scores.bonus > 0, pulls: (max * points) / MAX_POINTS, chip };
}

/** Season totals from every scored prediction: points, then perfect podiums, decide. */
export function leaderboard(
  series: SeriesKey,
  entries: readonly SeasonEntry[],
  chips: ReadonlyMap<string, Chip> = new Map(),
): Standing[] {
  const byUser = new Map<string, Standing>();

  for (const entry of entries) {
    const { userId } = entry;
    const standing = byUser.get(userId) ?? { userId, points: 0, perfect: 0, played: 0, pulls: 0 };
    const score = scoreEntry(series, entry, chips);
    standing.points += score.points;
    standing.perfect += score.perfect ? 1 : 0;
    standing.played++;
    standing.pulls += score.pulls;
    byUser.set(userId, standing);
  }

  return [...byUser.values()].toSorted(
    (a, b) => b.points - a.points || b.perfect - a.perfect || a.played - b.played,
  );
}
