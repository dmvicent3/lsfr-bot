export interface Reading {
  value: number;
  year: number;
}

export type Continent =
  | "africa"
  | "asia"
  | "europe"
  | "north_america"
  | "south_america"
  | "oceania";
export type Membership = "eu" | "nato" | "commonwealth" | "brics" | "opec";
export type Language = "en" | "fr" | "es" | "ar" | "pt";
export type FlagColour = "red" | "blue" | "green" | "yellow" | "white" | "black" | "orange";
export type FlagFeature = "star" | "crescent" | "emblem";

/** Wikidata facts and curated flag data; null means unknown and never matches a rule. */
export interface Facts {
  continents: Continent[];
  /** ISO2 codes of land neighbours among the snapshot countries. */
  borders: string[];
  landlocked: boolean | null;
  island: boolean | null;
  memberships: Membership[];
  languages: Language[];
  monarchy: boolean | null;
  drivesLeft: boolean | null;
  flagColours: FlagColour[];
  flagFeatures: FlagFeature[];
  aliases: string[];
}

export interface Country {
  iso2: string;
  name: string;
  /** Readings by stat id; ids are not validated here, modules look up the ones they use. */
  values: Partial<Record<string, Reading>>;
  facts: Facts;
}

export interface Snapshot {
  builtAt: string;
  countries: Country[];
}
