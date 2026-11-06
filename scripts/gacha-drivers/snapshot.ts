import { buildDrivers, finishedChampions } from "./build.ts";
import { parseDrivers, parseLeader, parseRaceCount, parseResults } from "./parse.ts";
import type { BuiltDriver, RawPages } from "./types.ts";

/** The snapshot from the downloaded pages. */
export function snapshotOf(
  pages: RawPages,
  builtAt: string,
): { builtAt: string; drivers: BuiltDriver[] } {
  const results = pages.results.flatMap(parseResults);
  const leaders = new Map(
    [...pages.standings].map(([season, page]) => [season, parseLeader(page)]),
  );
  const latest = results.filter((r) => r.season === pages.lastSeason);
  const champions = finishedChampions(leaders, {
    season: pages.lastSeason,
    races: parseRaceCount(pages.calendar),
    raced: new Set(latest.map((r) => r.round)).size,
  });

  return {
    builtAt,
    drivers: buildDrivers(pages.drivers.flatMap(parseDrivers), results, champions),
  };
}

/** Count per tier and a few names of each, for the build log. */
export function summary(drivers: readonly BuiltDriver[]): string[] {
  return ([5, 4, 3] as const).map((tier) => {
    const of = drivers.filter((d) => d.tier === tier);

    return `★${tier}: ${of.length} (${of
      .slice(0, 5)
      .map((d) => d.name)
      .join(", ")}, …)`;
  });
}
