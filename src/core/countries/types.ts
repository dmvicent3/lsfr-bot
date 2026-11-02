export interface Reading {
  value: number;
  year: number;
}

export interface Country {
  iso2: string;
  name: string;
  /** Readings by stat id; each module narrows the ids it knows. */
  values: Partial<Record<string, Reading>>;
}

export interface Snapshot {
  builtAt: string;
  countries: Country[];
}
