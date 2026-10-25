import type { Prediction, Score, Standing } from "./types.ts";
import { nameIn } from "./predictions.ts";
import type { ResultRow } from "../results/types.ts";
import type { SeriesInfo } from "../types.ts";
import { tableMessage } from "../format.ts";

const EXACT = 5;
const ON_PODIUM = 2;
const PERFECT_BONUS = 5;

/** 5 per exact position, 2 for a podium driver in the wrong place, +5 for all three exact. */
export function scorePicks(picks: readonly string[], rows: ResultRow[]): Score {
  const podium = ["1", "2", "3"].map((pos) => rows.find((r) => r.pos === pos)?.id ?? null);
  let exact = 0;
  let points = 0;
  for (const [i, id] of picks.entries()) {
    if (podium[i] === id) {
      exact++;
      points += EXACT;
    } else if (podium.includes(id)) {
      points += ON_PODIUM;
    }
  }
  const perfect = exact === 3;
  return { points: points + (perfect ? PERFECT_BONUS : 0), perfect };
}

/** Season totals from every scored prediction: points, then perfect podiums, decide. */
export function leaderboard(
  entries: { userId: string; picks: readonly string[]; rows: ResultRow[] }[],
): Standing[] {
  const byUser = new Map<string, Standing>();
  for (const { userId, picks, rows } of entries) {
    const standing = byUser.get(userId) ?? { userId, points: 0, perfect: 0, played: 0 };
    const score = scorePicks(picks, rows);
    standing.points += score.points;
    standing.perfect += score.perfect ? 1 : 0;
    standing.played++;
    byUser.set(userId, standing);
  }
  return [...byUser.values()].toSorted(
    (a, b) => b.points - a.points || b.perfect - a.perfect || a.played - b.played,
  );
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

export function renderLeaderboard(info: SeriesInfo, year: number, standings: Standing[]): string {
  const heading = `## 🔮 ${info.name} predictions — ${year} season`;
  if (standings.length === 0) {
    return `${heading}\nNo predictions scored yet. Use 🔮 Predict on the pinned schedule.`;
  }
  const lines = standings.map((s, i) =>
    [
      `**${i + 1}.** <@${s.userId}>`,
      `**${s.points}** pts`,
      ...(s.perfect > 0 ? [`${s.perfect} perfect`] : []),
      plural(s.played, "race"),
    ].join(" · "),
  );
  return tableMessage(heading, lines);
}

/** Posted under a race or sprint's results: everyone's picks and points, spoilered. */
export function renderPredictionResults(predictions: Prediction[], rows: ResultRow[]): string {
  const scored = predictions
    .map((p) => ({ ...p, score: scorePicks(p.picks, rows) }))
    .toSorted((a, b) => b.score.points - a.score.points);
  const lines = scored.map(({ userId, picks, score }) => {
    const names = picks.map((id) => nameIn(rows, id)).join(" · ");
    return `<@${userId}> ${names} → **${score.points}** pts${score.perfect ? " 🎯" : ""}`;
  });
  return tableMessage("### 🔮 Predictions", lines, true);
}
