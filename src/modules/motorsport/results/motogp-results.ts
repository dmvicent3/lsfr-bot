import { asText, isRecord, isString, records } from "../../../core/guards.ts";
import { lapsDown } from "./results.ts";
import type { ResultKind, SessionResult } from "./types.ts";

export const MOTOGP_RESULTS = "https://api.motogp.pulselive.com/motogp";

const idOf = (r: Record<string, unknown> | undefined): string | null =>
  r && isString(r["id"]) ? r["id"] : null;

export function motogpSeasonId(seasons: unknown, year: number): string | null {
  return idOf(records(seasons).find((s) => s["year"] === year));
}

/** The (non-test) event whose last day is the race day, `YYYY-MM-DD` UTC. */
export function motogpEventId(events: unknown, raceDay: string): string | null {
  return idOf(records(events).find((e) => e["test"] !== true && e["date_end"] === raceDay));
}

export function motogpCategoryId(categories: unknown): string | null {
  return idOf(
    records(categories).find((c) => isString(c["name"]) && c["name"].startsWith("MotoGP")),
  );
}

/** Race → RAC, sprint → SPR, qualifying → Q2 (the session that sets the front of the grid). */
export function motogpSessionId(sessions: unknown, kind: ResultKind): string | null {
  const match = (s: Record<string, unknown>): boolean => {
    if (kind === "race") return s["type"] === "RAC";
    if (kind === "sprint") return s["type"] === "SPR";
    if (kind === "qualifying") return s["type"] === "Q" && s["number"] === 2;
    return false;
  };
  return idOf(records(sessions).find(match));
}

export function motogpQ1SessionId(sessions: unknown): string | null {
  return idOf(records(sessions).find((s) => s["type"] === "Q" && s["number"] === 1));
}

/** "01:28.852" → "1:28.852". */
const trimTime = (t: unknown): string => (isString(t) ? t.replace(/^0(\d:)/, "$1") : "");

function timeOf(kind: ResultKind, r: Record<string, unknown>, first: boolean): string {
  const gap = isRecord(r["gap"]) ? r["gap"] : {};
  if (r["position"] === null) return "DNF";
  if (first) {
    return kind === "qualifying" ? bestLap(r) : trimTime(r["time"]);
  }
  const laps = Number(gap["lap"] ?? 0);
  if (laps > 0) return lapsDown(laps);
  return isString(gap["first"]) ? `+${gap["first"]}` : "";
}

const position = (r: Record<string, unknown>): number =>
  typeof r["position"] === "number" ? r["position"] : Infinity;

const byPosition = (json: unknown): Record<string, unknown>[] =>
  isRecord(json)
    ? records(json["classification"]).toSorted((a, b) => position(a) - position(b))
    : [];

const riderId = (r: Record<string, unknown>): string =>
  isRecord(r["rider"]) ? asText(r["rider"]["id"]) : "";

const bestLap = (r: Record<string, unknown>): string =>
  trimTime(isRecord(r["best_lap"]) ? r["best_lap"]["time"] : "");

/**
 * A v2 `classifications` response → every row, or null when not published yet. For
 * qualifying, pass Q1 too: riders knocked out there fill the grid below Q2.
 */
export function parseMotogp(kind: ResultKind, json: unknown, q1?: unknown): SessionResult | null {
  const main = byPosition(json);
  if (main.length === 0) return null;
  const entries = main.map((r, i) => ({
    r,
    pos: Number.isFinite(position(r)) ? String(position(r)) : "–",
    time: timeOf(kind, r, i === 0 && r["position"] === 1),
  }));
  if (kind === "qualifying") {
    const inQ2 = new Set(main.map(riderId));
    const knockedOut = byPosition(q1).filter((r) => !inQ2.has(riderId(r)));
    for (const [k, r] of knockedOut.entries()) {
      entries.push({ r, pos: String(main.length + k + 1), time: `Q1 ${bestLap(r)}` });
    }
  }
  const names = riderNames(entries.map(({ r }) => r));
  return {
    rows: entries.map(({ r, pos, time }, i) => ({
      pos,
      id: riderId(r),
      name: names[i] ?? "",
      team: isRecord(r["constructor"]) ? asText(r["constructor"]["name"]) : "",
      time,
    })),
  };
}

/** Surnames, with an initial where two riders share one ("M. Marquez", "A. Marquez"). */
export function riderNames(riders: Record<string, unknown>[]): string[] {
  const names = riders.map((r) => {
    const full = isRecord(r["rider"]) ? asText(r["rider"]["full_name"]) : "";
    const [first = "", ...rest] = full.split(" ");
    return { first, surname: rest.join(" ") || first };
  });
  const count = new Map<string, number>();
  for (const n of names) count.set(n.surname, (count.get(n.surname) ?? 0) + 1);
  return names.map((n) =>
    (count.get(n.surname) ?? 0) > 1 ? `${n.first.slice(0, 1)}. ${n.surname}` : n.surname,
  );
}
