import type { EntryScore, Prediction, Standing } from "./types.ts";
import type { ResultRow } from "../results/types.ts";
import type { SeriesInfo } from "../types.ts";
import { tableMessage } from "../format.ts";
import { chipLabel } from "./chips.ts";
import { nameIn } from "./predictions.ts";
import { rulesOf } from "./rules.ts";

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "2.25 pulls", at most two decimals. */
export const pullsText = (n: number): string =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} pull${n === 1 ? "" : "s"}`;

export function renderLeaderboard(info: SeriesInfo, year: number, standings: Standing[]): string {
  const heading = `## 🔮 ${info.name} predictions — ${year} season`;
  const fantasy = rulesOf(info.key).fantasy;

  if (standings.length === 0) {
    return `${heading}\nNo predictions scored yet. Use 🔮 Predict on the pinned schedule.`;
  }

  const lines = standings.map((s, i) =>
    [
      `**${i + 1}.** <@${s.userId}>`,
      `**${s.points}** pts`,
      ...(s.perfect > 0 ? [`${s.perfect} perfect`] : []),
      plural(s.played, fantasy ? "session" : "race"),
      ...(fantasy ? [pullsText(s.pulls)] : []),
    ].join(" · "),
  );

  return tableMessage(heading, lines);
}

/** A prediction with its score after chips. */
export type ScoredPrediction = Prediction & { score: EntryScore };

/**
 * Posted under a scored session's results: everyone's picks and points, spoilered; with
 * `pulls`, also the chip that changed the session and the pulls earned.
 */
export function renderPredictionResults(
  predictions: ScoredPrediction[],
  rows: ResultRow[],
  pulls = false,
): string {
  const lines = predictions
    .toSorted((a, b) => b.score.points - a.score.points)
    .map(({ userId, picks, score }) => {
      const names = picks.map((id) => nameIn(rows, id)).join(" · ");
      const extras = [
        ...(score.chip ? [chipLabel(score.chip)] : []),
        ...(pulls ? [pullsText(score.pulls)] : []),
      ].map((e) => ` · ${e}`);

      return `<@${userId}> ${names} → **${score.points}** pts${score.perfect ? " 🎯" : ""}${extras.join("")}`;
    });

  return tableMessage("### 🔮 Predictions", lines, true);
}
