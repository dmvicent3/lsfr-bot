import { asText, isRecord, isString } from "../../../core/guards.ts";
import { lapsDown, RESULT_ROWS, type ResultKind, type SessionResult } from "../results.ts";

export const MOTOGP_RESULTS = "https://api.motogp.pulselive.com/motogp";

const records = (json: unknown): Record<string, unknown>[] =>
  Array.isArray(json) ? (json as unknown[]).filter(isRecord) : [];

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

/** "01:28.852" → "1:28.852". */
const trimTime = (t: unknown): string => (isString(t) ? t.replace(/^0(\d:)/, "$1") : "");

function timeOf(kind: ResultKind, r: Record<string, unknown>, first: boolean): string {
  const gap = isRecord(r["gap"]) ? r["gap"] : {};
  if (r["position"] === null) return "DNF";
  if (first) {
    return trimTime(
      kind === "qualifying" ? (isRecord(r["best_lap"]) ? r["best_lap"]["time"] : "") : r["time"],
    );
  }
  const laps = Number(gap["lap"] ?? 0);
  if (laps > 0) return lapsDown(laps);
  return isString(gap["first"]) ? `+${gap["first"]}` : "";
}

/** A v2 `classifications` response → the top rows, or null when not published yet. */
export function parseMotogp(kind: ResultKind, json: unknown): SessionResult | null {
  if (!isRecord(json)) return null;
  const rows = records(json["classification"])
    .toSorted(
      (a, b) =>
        (typeof a["position"] === "number" ? a["position"] : Infinity) -
        (typeof b["position"] === "number" ? b["position"] : Infinity),
    )
    .slice(0, RESULT_ROWS);
  if (rows.length === 0) return null;
  const names = rows.map((r) => {
    const full = isRecord(r["rider"]) ? asText(r["rider"]["full_name"]) : "";
    const [first = "", ...rest] = full.split(" ");
    return { first, surname: rest.join(" ") || first };
  });
  const surnameCount = new Map<string, number>();
  for (const n of names) surnameCount.set(n.surname, (surnameCount.get(n.surname) ?? 0) + 1);
  return {
    rows: rows.map((r, i) => {
      const n = names[i] ?? { first: "", surname: "" };
      const shared = (surnameCount.get(n.surname) ?? 0) > 1;
      return {
        pos: typeof r["position"] === "number" ? String(r["position"]) : "–",
        name: shared ? `${n.first.slice(0, 1)}. ${n.surname}` : n.surname,
        team: isRecord(r["constructor"]) ? asText(r["constructor"]["name"]) : "",
        time: timeOf(kind, r, i === 0 && r["position"] === 1),
      };
    }),
  };
}
