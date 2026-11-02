export interface Reading {
  value: number;
  year: number;
}

export interface Country {
  iso2: string;
  name: string;
  /** Readings by stat id; ids are not validated here, modules look up the ones they use. */
  values: Partial<Record<string, Reading>>;
}

export interface Snapshot {
  builtAt: string;
  countries: Country[];
}
