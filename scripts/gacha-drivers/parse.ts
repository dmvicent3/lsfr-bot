import { asText, isRecord, records } from "../../src/core/guards.ts";
import type { ApiDriver, ApiResult } from "./types.ts";

/** The MRData table `key` of a page, e.g. "DriverTable"; {} when missing. */
function table(page: unknown, key: string): Record<string, unknown> {
  const mr = isRecord(page) && isRecord(page.MRData) ? page.MRData : {};
  const t = mr[key];

  return isRecord(t) ? t : {};
}

export function parseDrivers(page: unknown): ApiDriver[] {
  return records(table(page, "DriverTable").Drivers).map((d) => ({
    id: asText(d.driverId),
    name: `${asText(d.givenName)} ${asText(d.familyName)}`.trim(),
    nationality: asText(d.nationality),
  }));
}

export function parseResults(page: unknown): ApiResult[] {
  return records(table(page, "RaceTable").Races).flatMap((race) =>
    records(race.Results).map((r) => ({
      driverId: isRecord(r.Driver) ? asText(r.Driver.driverId) : "",
      season: Number(race.season),
      round: Number(race.round),
      position: asText(r.position),
      grid: Number(r.grid),
      status: asText(r.status),
    })),
  );
}

/** The driver placed first in a season's standings; null when the page has none. */
export function parseLeader(page: unknown): string | null {
  const [list] = records(table(page, "StandingsTable").StandingsLists);
  const first = records(list?.DriverStandings).find((s) => asText(s.position) === "1");

  return first && isRecord(first.Driver) ? asText(first.Driver.driverId) || null : null;
}

/** How many races a season's calendar holds. */
export const parseRaceCount = (page: unknown): number =>
  records(table(page, "RaceTable").Races).length;
