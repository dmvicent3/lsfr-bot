/** The Wikidata queries behind each picture category; each selects ?item ?label ?img ?links ?alts. */

const LABEL = (v: string, out: string): string =>
  `${v} rdfs:label ${out} FILTER(LANG(${out}) = "en")`;

/** The common shell: English label, English alt labels joined by "|", most sitelinks first. */
const shell = (
  inner: string,
  limit: number,
  alias = 'OPTIONAL { ?item skos:altLabel ?alt FILTER(LANG(?alt) = "en") }',
): string => `
SELECT ?item ?label ?img ?links (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts) WHERE {
  ${inner}
  ${alias}
} GROUP BY ?item ?label ?img ?links ORDER BY DESC(?links) LIMIT ${limit}`;

const PAINTING =
  "?item wdt:P31 wd:Q3305213; wdt:P18 ?img; wikibase:sitelinks ?links. FILTER(?links > 12)";

/** Painter answers: the creator's name, the family name as alias; unknown masters left out. */
const PAINTER = `${PAINTING}
  ?item wdt:P170 ?creator. ${LABEL("?creator", "?label")}
  FILTER(!REGEX(?label, "anonymous|unknown|Master of", "i"))`;

const PEOPLE = [
  "Q33999",
  "Q177220",
  "Q937857",
  "Q10841764",
  "Q82955",
  "Q169470",
  "Q10833314",
  "Q3665646",
  "Q36180",
];

const person = (occupation: string): string =>
  shell(
    `?item wdt:P106 wd:${occupation}; wdt:P31 wd:Q5; wdt:P18 ?img; wikibase:sitelinks ?links.
     FILTER(?links > 60) ${LABEL("?item", "?label")}`,
    60,
    `OPTIONAL { ?item wdt:P734 ?family. ${LABEL("?family", "?alt")} }`,
  );

export interface CategoryQuery {
  category: string;
  prompt: string;
  queries: string[];
  surnames?: boolean;
}

export const CATEGORIES: CategoryQuery[] = [
  {
    category: "Flags",
    prompt: "Name the country",
    queries: [
      shell(
        `?item wdt:P31 wd:Q3624078; wdt:P41 ?img; wikibase:sitelinks ?links.
         FILTER NOT EXISTS { ?item wdt:P576 [] } ${LABEL("?item", "?label")}`,
        300,
      ),
    ],
  },
  {
    category: "Paintings",
    prompt: "Name the painting",
    queries: [shell(`${PAINTING} ${LABEL("?item", "?label")}`, 300)],
  },
  {
    category: "Painters",
    prompt: "Name the artist",
    surnames: true,
    queries: [
      shell(PAINTER, 300, `OPTIONAL { ?creator wdt:P734 ?family. ${LABEL("?family", "?alt")} }`),
    ],
  },
  {
    category: "Landmarks",
    prompt: "Name the place",
    queries: [
      shell(
        `?item wdt:P1435 wd:Q9259; wdt:P18 ?img; wikibase:sitelinks ?links. FILTER(?links > 40) ${LABEL("?item", "?label")}`,
        200,
      ),
    ],
  },
  { category: "People", prompt: "Who is this?", queries: PEOPLE.map(person), surnames: true },
  {
    category: "Logos",
    prompt: "Name the club",
    queries: [
      shell(
        `?item wdt:P31 wd:Q476028; wdt:P154 ?img; wikibase:sitelinks ?links. FILTER(?links > 25) ${LABEL("?item", "?label")}`,
        200,
      ),
    ],
  },
];
