/** The API pages as downloaded, not yet read. */
export interface RawPages {
  drivers: unknown[];
  results: unknown[];
  standings: Map<number, unknown>;
  /** The latest season's race calendar, to tell whether its title is settled. */
  calendar: unknown;
  lastSeason: number;
}

/** A driver as the API lists them. */
export interface ApiDriver {
  id: string;
  name: string;
  family: string;
  nationality: string;
}

/** One race result row, cut to what the snapshot needs. */
export interface ApiResult {
  driverId: string;
  season: number;
  round: number;
  position: string;
  grid: number;
  status: string;
}

/** Season → champion's driver id. */
export type Champions = Map<number, string>;

/** One driver as the snapshot stores them. */
export interface BuiltDriver {
  id: string;
  name: string;
  /** The family name, drawn large on the card. */
  family: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  first: number;
  last: number;
  titles: number;
  wins: number;
  /** Races started from grid slot 1. */
  poles: number;
  starts: number;
  tier: 3 | 4 | 5;
}
