import type { Picks, FullPicks, Prediction, Score, Standing, Driver } from "./types.ts";
import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { SchedulePayload } from "../channels/types.ts";
import { resultKind } from "../results/results.ts";
import type { ResultRow } from "../results/types.ts";
import type { SeriesInfo } from "../types.ts";
import { tableMessage } from "../table.ts";
import type { EventSchedule, SeriesKey, Session } from "../types.ts";

const EXACT = 5;
const ON_PODIUM = 2;
const PERFECT_BONUS = 5;
const MAX_SELECT_OPTIONS = 25;
const POSITIONS = ["P1", "P2", "P3"] as const;

export const isComplete = (picks: Picks): picks is FullPicks => picks.every((p) => p !== null);

export function isPredictable(series: SeriesKey, sessionId: string): boolean {
  const kind = resultKind(series, sessionId);
  return kind === "race" || kind === "sprint";
}

/** The event's races and sprints that haven't started: predictions lock at the start. */
export function openPredictions(event: EventSchedule, now: number): Session[] {
  return event.sessions.filter(
    (s) => isPredictable(s.series, s.sessionId) && s.start.getTime() > now,
  );
}

/** Sets one position; a driver already placed elsewhere swaps with whoever was here. */
export function choosePick(picks: Picks, index: number, id: string): Picks {
  const next: Picks = [...picks];
  const previous = next[index] ?? null;
  const elsewhere = next.indexOf(id);
  if (elsewhere !== -1) next[elsewhere] = previous;
  next[index] = id;
  return next;
}

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

const nameIn = (drivers: readonly Driver[], id: string): string =>
  drivers.find((d) => d.id === id)?.name ?? "?";

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

/**
 * The private podium picker: one select per position, the viewer's picks preselected, and
 * a button for each other open session this weekend.
 */
export function renderPredictPicker(
  info: SeriesInfo,
  eventName: string,
  session: Session,
  grid: readonly Driver[],
  picks: Picks,
  others: readonly Session[],
): SchedulePayload {
  const lock = Math.floor(session.start.getTime() / 1000);
  const status = isComplete(picks)
    ? `✅ Entered: ${picks.map((id) => nameIn(grid, id)).join(" · ")}. Change any time before the start.`
    : "Pick all three to enter.";
  const drivers = grid.slice(0, MAX_SELECT_OPTIONS);
  const selects: APIActionRowComponent<APIComponentInMessageActionRow>[] = POSITIONS.map(
    (label, index) => ({
      type: ComponentType.ActionRow,
      components: [
        {
          type: ComponentType.StringSelect,
          custom_id: `motorsport:predict:${info.key}:${session.eventId}:${session.sessionId}:${index}`,
          placeholder: label,
          options: drivers.map((d) => ({
            label: d.name,
            value: d.id,
            default: picks[index] === d.id,
          })),
        },
      ],
    }),
  );
  const switches: APIActionRowComponent<APIComponentInMessageActionRow>[] =
    others.length === 0
      ? []
      : [
          {
            type: ComponentType.ActionRow,
            components: others.slice(0, 5).map((s) => ({
              type: ComponentType.Button,
              custom_id: `motorsport:predictmenu:${info.key}:${s.eventId}:${s.sessionId}`,
              label: `Predict the ${s.title}`,
              style: ButtonStyle.Secondary,
            })),
          },
        ];
  return {
    content: `🔮 **${info.name} ${eventName} ${session.title}** podium · locks <t:${lock}:R>\n${status}`,
    components: [...selects, ...switches],
  };
}
