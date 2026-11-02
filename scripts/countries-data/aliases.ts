/** Common short forms players type, keyed by ISO2 (England, Scotland and Wales are deliberately absent). */
export const EXTRA_ALIASES: Record<string, string[]> = {
  US: ["USA", "US", "America", "United States of America"],
  GB: ["UK", "Britain", "Great Britain", "United Kingdom of Great Britain and Northern Ireland"],
  CZ: ["Czech Republic"],
  CI: ["Ivory Coast", "Cote d'Ivoire"],
  CD: ["DRC", "Congo-Kinshasa", "Democratic Republic of the Congo", "Congo DRC"],
  CG: ["Congo-Brazzaville"],
  MM: ["Burma"],
  SZ: ["Swaziland"],
  TL: ["East Timor", "Timor Leste"],
  AE: ["UAE", "Emirates"],
  KR: ["Korea, South", "Republic of Korea", "Korea Republic", "South Korea (ROK)"],
  KP: ["Korea, North", "DPRK", "Democratic People's Republic of Korea"],
  NL: ["Holland", "The Netherlands"],
  TR: ["Turkey"],
  CV: ["Cape Verde"],
  MK: ["Macedonia"],
  BA: ["Bosnia"],
  ST: ["Sao Tome and Principe"],
  KN: ["Saint Kitts and Nevis"],
  LC: ["Saint Lucia"],
  VC: ["Saint Vincent and the Grenadines"],
  PS: ["State of Palestine"],
  RU: ["Russian Federation"],
};

/** Wikidata alt labels that name a part of a country, a region or something else entirely. */
const BLOCKED = new Set([
  "england",
  "scotland",
  "wales",
  "northern ireland",
  "central africa",
  "garden city",
  "heart of south america",
]);
/** Codes and tz names ("ISO 3166-1:AS", "Atlantic/Bermuda", "US-GU") are not names players type. */
const isJunk = (alias: string): boolean => /[:/]|^[A-Z]{2}-[A-Z]{2}$/.test(alias);
/** Wikidata aliases of three letters are mostly noise, except all-caps ones such as PRC. */
const isWorthy = (alias: string): boolean => norm(alias).length > 3 || /^[A-Z]{3}$/.test(alias);

const norm = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();

function claims(list: { iso2: string; names: string[] }[]): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();

  for (const { iso2, names } of list) {
    for (const name of names)
      owners.set(norm(name), (owners.get(norm(name)) ?? new Set()).add(iso2));
  }

  return owners;
}

/**
 * Wikidata aliases plus the checked-in ones, without the country's own name, blocked words,
 * or any alias that is another country's name or alias (those would be ambiguous to match).
 */
export function mergeAliases(
  countries: { iso2: string; name: string }[],
  wikidata: Map<string, string[]>,
): Map<string, string[]> {
  const lists = countries.map((c) => ({
    ...c,
    list: [
      ...(EXTRA_ALIASES[c.iso2] ?? []),
      ...(wikidata.get(c.iso2) ?? []).filter((a) => isWorthy(a) && !isJunk(a)),
    ],
  }));
  const owners = claims([
    ...lists.map((c) => ({ iso2: c.iso2, names: [c.name] })),
    ...lists.map((c) => ({ iso2: c.iso2, names: c.list })),
  ]);
  const usable = (alias: string, own: string) =>
    norm(alias).length > 1 &&
    norm(alias) !== norm(own) &&
    !BLOCKED.has(norm(alias)) &&
    owners.get(norm(alias))?.size === 1;

  return new Map(
    lists.map((c) => {
      const keep = new Map(c.list.filter((a) => usable(a, c.name)).map((a) => [norm(a), a]));

      return [c.iso2, [...keep.values()]];
    }),
  );
}
