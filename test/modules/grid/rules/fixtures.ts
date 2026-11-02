import type { Country } from "../../../../src/core/countries/types.ts";

export function country(
  over: Partial<Omit<Country, "facts">> & { facts?: Partial<Country["facts"]> } = {},
): Country {
  const { facts, ...rest } = over;

  return {
    iso2: "XX",
    name: "Xland",
    values: {},
    ...rest,
    facts: {
      continents: [],
      borders: [],
      landlocked: false,
      island: false,
      memberships: [],
      languages: [],
      monarchy: false,
      drivesLeft: false,
      flagColours: [],
      flagFeatures: [],
      aliases: [],
      ...facts,
    },
  };
}

export function reading(value: number) {
  return { value, year: 2024 };
}
