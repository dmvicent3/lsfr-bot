import type { ResultKind, ResultRow } from "../results/types.ts";
import type { MotorsportRepo } from "../repo.ts";
import { seriesInfo } from "../series.ts";
import type { SeriesKey, Session } from "../types.ts";
import { chipsByWeekend, leaderboard, scoreEntry } from "./payout.ts";
import { renderLeaderboard, renderPredictionResults } from "./render.ts";
import { rulesOf } from "./rules.ts";

/** The public season table: predictions scored after chips against results posted this (UTC) year. */
export function seasonLeaderboard(repo: MotorsportRepo, series: SeriesKey, now: number): string {
  const year = new Date(now).getUTCFullYear();
  const query = { kinds: rulesOf(series).kinds, since: Date.UTC(year, 0, 1) };
  const entries = repo.predictions.scored(series, query);
  const chips = chipsByWeekend(repo.chips.all(series));

  return renderLeaderboard(seriesInfo(series), year, leaderboard(series, entries, chips));
}

/** The predictions block under a session's results; null when nobody predicted it. */
export function predictionsPost(
  repo: MotorsportRepo,
  { series, eventId, sessionId }: Session,
  kind: ResultKind,
  rows: ResultRow[],
): string | null {
  const predictions = repo.predictions.complete(series, eventId, sessionId);

  if (predictions.length === 0) return null;

  const chips = chipsByWeekend(repo.chips.all(series));
  const scored = predictions.map((p) => ({
    ...p,
    score: scoreEntry(series, { ...p, eventId, sessionId, kind, rows }, chips),
  }));

  return renderPredictionResults(scored, rows, rulesOf(series).fantasy);
}
