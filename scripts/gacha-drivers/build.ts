import { flagCode } from "./nationalities.ts";
import type { ApiDriver, ApiResult, BuiltDriver, Champions } from "./types.ts";

/** Entries that never took the start. */
const NO_START = new Set(["Did not qualify", "Did not prequalify", "Withdrew", "Did not start"]);

interface Tally {
  first: number;
  last: number;
  wins: number;
  poles: number;
  starts: number;
}

function tallies(results: readonly ApiResult[]): Map<string, Tally> {
  const out = new Map<string, Tally>();

  for (const r of results) {
    if (NO_START.has(r.status)) continue;

    const t = out.get(r.driverId) ?? {
      first: r.season,
      last: r.season,
      wins: 0,
      poles: 0,
      starts: 0,
    };
    t.first = Math.min(t.first, r.season);
    t.last = Math.max(t.last, r.season);
    t.wins += r.position === "1" ? 1 : 0;
    t.poles += r.grid === 1 ? 1 : 0;
    t.starts++;
    out.set(r.driverId, t);
  }

  return out;
}

const tierOf = (titles: number, wins: number): 3 | 4 | 5 => {
  if (titles > 0) return 5;

  return wins > 0 ? 4 : 3;
};

/** Every driver with a start, with their tier; sorted by tier, then titles, wins and name. */
export function buildDrivers(
  drivers: readonly ApiDriver[],
  results: readonly ApiResult[],
  champions: Champions,
): BuiltDriver[] {
  const byDriver = tallies(results);
  const titles = new Map<string, number>();

  for (const id of champions.values()) titles.set(id, (titles.get(id) ?? 0) + 1);

  return drivers
    .flatMap((d): BuiltDriver[] => {
      const t = byDriver.get(d.id);

      if (!t) return [];

      const won = titles.get(d.id) ?? 0;

      return [
        {
          id: d.id,
          name: d.name,
          family: d.family,
          country: flagCode(d.nationality),
          ...t,
          titles: won,
          tier: tierOf(won, t.wins),
        },
      ];
    })
    .toSorted(
      (a, b) =>
        b.tier - a.tier || b.titles - a.titles || b.wins - a.wins || a.name.localeCompare(b.name),
    );
}

/**
 * Each finished season's champion. The latest season counts only once every race on its
 * calendar has a result.
 */
export function finishedChampions(
  leaders: ReadonlyMap<number, string | null>,
  latest: { season: number; races: number; raced: number },
): Champions {
  const out: Champions = new Map();

  for (const [season, id] of leaders) {
    const open = season === latest.season && latest.raced < latest.races;

    if (id && !open) out.set(season, id);
  }

  return out;
}
