import type { Championship, Standings } from "./types.ts";
import { asText, isRecord, records } from "../../../core/guards.ts";
import { riderNames } from "../results/motogp-results.ts";

/** Shorter constructor names so the table stays narrow. */
const TEAM_ALIAS: Record<string, string> = {
  "RB F1 Team": "Racing Bulls",
  "Alpine F1 Team": "Alpine",
  "Haas F1 Team": "Haas",
  "Cadillac F1 Team": "Cadillac",
};

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
