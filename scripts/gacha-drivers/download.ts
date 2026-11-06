import { allPages, type Downloader } from "./fetch.ts";
import type { RawPages } from "./types.ts";

/** Every page the snapshot is built from: drivers, all race results, each season's final standings, and the latest season's calendar. */
export async function downloadAll(d: Downloader, lastSeason: number): Promise<RawPages> {
  const drivers = await allPages(d, "drivers.json", "drivers");
  const results = await allPages(d, "results.json", "results");
  const standings = new Map<number, unknown>();

  for (let year = 1950; year <= lastSeason; year++) {
    standings.set(year, await d.get(`${year}/driverstandings.json?limit=100`, `standings-${year}`));
  }

  const calendar = await d.get(`${lastSeason}.json?limit=100`, `calendar-${lastSeason}`);

  return { drivers, results, standings, calendar, lastSeason };
}
