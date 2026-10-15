import { asText, type FetchFn, isRecord, isString } from "../../core/guards.ts";
import type { SeriesInfo } from "./series.ts";
import { getJson } from "./sources/fetch.ts";
import {
  MOTOGP_RESULTS,
  motogpCategoryId,
  motogpSeasonId,
  riderNames,
} from "./sources/motogp-results.ts";
import { fitName, fitTeam, formatTable, posLabel, tableMessage } from "./table.ts";
import type { SeriesKey } from "./types.ts";

export type Championship = "drivers" | "constructors";

export interface StandingRow {
  pos: string;
  name: string;
  /** Empty for constructors. */
  team: string;
  points: string;
  wins: string;
}

export interface Standings {
  /** The round the standings are after, when the source says. */
  round: number | null;
  rows: StandingRow[];
}

const JOLPICA = "https://api.jolpi.ca/ergast/f1/current";

/** Shorter constructor names so the table stays narrow. */
const TEAM_ALIAS: Record<string, string> = {
  "RB F1 Team": "Racing Bulls",
  "Alpine F1 Team": "Alpine",
  "Haas F1 Team": "Haas",
  "Cadillac F1 Team": "Cadillac",
};

const records = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as unknown[]).filter(isRecord) : [];

const teamName = (constructor: unknown): string => {
  const name = isRecord(constructor) ? asText(constructor["name"]) : "";
  return TEAM_ALIAS[name] ?? name;
};

/** Jolpica `driverStandings` / `constructorStandings` → rows, or null for anything else. */
export function parseJolpicaStandings(champ: Championship, json: unknown): Standings | null {
  if (!isRecord(json) || !isRecord(json["MRData"])) return null;
  const table = json["MRData"]["StandingsTable"];
  if (!isRecord(table)) return null;
  const list = records(table["StandingsLists"])[0];
  if (!list) return null;
  const entries = records(list[champ === "drivers" ? "DriverStandings" : "ConstructorStandings"]);
  const rows = entries.map((e) => {
    const driver = isRecord(e["Driver"]) ? e["Driver"] : {};
    return {
      pos: asText(e["positionText"]) || asText(e["position"]),
      name: champ === "drivers" ? asText(driver["familyName"]) : teamName(e["Constructor"]),
      team: champ === "drivers" ? teamName(records(e["Constructors"]).at(-1)) : "",
      points: asText(e["points"]),
      wins: asText(e["wins"]),
    };
  });
  const round = Number(list["round"]);
  return { round: Number.isFinite(round) ? round : null, rows };
}

/** MotoGP `standings` → riders' rows, or null. */
export function parseMotogpStandings(json: unknown): Standings | null {
  if (!isRecord(json)) return null;
  const entries = records(json["classification"]);
  if (entries.length === 0) return null;
  const names = riderNames(entries);
  return {
    round: null,
    rows: entries.map((e, i) => ({
      pos: asText(e["position"]) || "–",
      name: names[i] ?? "",
      team: isRecord(e["constructor"]) ? asText(e["constructor"]["name"]) : "",
      points: asText(e["points"]),
      wins: asText(e["race_wins"]),
    })),
  };
}

const TITLE: Record<SeriesKey, Record<Championship, string>> = {
  f1: { drivers: "Drivers'", constructors: "Constructors'" },
  motogp: { drivers: "Riders'", constructors: "Constructors'" },
  wec: { drivers: "Drivers'", constructors: "Manufacturers'" },
  wrc: { drivers: "Drivers'", constructors: "Manufacturers'" },
  indycar: { drivers: "Drivers'", constructors: "Manufacturers'" },
  fe: { drivers: "Drivers'", constructors: "Teams'" },
  f2: { drivers: "Drivers'", constructors: "Teams'" },
  f3: { drivers: "Drivers'", constructors: "Teams'" },
};

export function renderStandings(
  info: SeriesInfo,
  champ: Championship,
  standings: Standings,
): string {
  const after = standings.round === null ? "" : ` (after round ${standings.round})`;
  const heading = `## 🏆 ${info.name} — ${TITLE[info.key][champ]} standings${after}`;
  if (standings.rows.length === 0) return `${heading}\nNo standings yet.`;
  const lines =
    champ === "drivers"
      ? formatTable(
          standings.rows.map((r) => [
            posLabel(r.pos),
            fitName(r.name),
            fitTeam(r.team),
            r.points,
            `${r.wins}W`,
          ]),
          new Set([3, 4]),
        )
      : formatTable(
          standings.rows.map((r) => [posLabel(r.pos), fitName(r.name), r.points, `${r.wins}W`]),
          new Set([2, 3]),
        );
  return tableMessage(heading, lines);
}

/** The series with standings sources: F1 (drivers + constructors), MotoGP (riders). */
export const STANDINGS_SERIES: readonly SeriesKey[] = ["f1", "motogp"];

const day = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Current standings, fetched live; null when the series or championship has no source (or
 * nothing is published). Throws on fetch errors.
 */
export async function fetchStandings(
  series: SeriesKey,
  champ: Championship,
  now: Date,
  fetchFn: FetchFn = fetch,
): Promise<Standings | null> {
  if (series === "f1") {
    const path = champ === "drivers" ? "driverStandings" : "constructorStandings";
    return parseJolpicaStandings(
      champ,
      await getJson(`${JOLPICA}/${path}.json?limit=100`, fetchFn),
    );
  }
  if (series !== "motogp" || champ !== "drivers") return null;
  const api = `${MOTOGP_RESULTS}/v1/results`;
  const seasonId = motogpSeasonId(await getJson(`${api}/seasons`, fetchFn), now.getUTCFullYear());
  if (seasonId === null) return null;
  // Categories hang off an event; any finished race weekend of the season will do.
  const events = records(await getJson(`${api}/events?seasonUuid=${seasonId}`, fetchFn))
    .filter((e) => e["test"] !== true && isString(e["date_end"]) && e["date_end"] <= day(now))
    .toSorted((a, b) => asText(b["date_end"]).localeCompare(asText(a["date_end"])));
  const eventId = events[0]?.["id"];
  if (!isString(eventId)) return null;
  const categoryId = motogpCategoryId(
    await getJson(`${api}/categories?eventUuid=${eventId}`, fetchFn),
  );
  if (categoryId === null) return null;
  return parseMotogpStandings(
    await getJson(`${api}/standings?seasonUuid=${seasonId}&categoryUuid=${categoryId}`, fetchFn),
  );
}
