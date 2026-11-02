import { asText, isRecord, records } from "../../src/core/guards.ts";
import { emptyFacts } from "../../src/core/countries/facts.ts";
import { landBorders } from "./borders.ts";
import type { Continent, Facts, Language, Membership } from "../../src/core/countries/types.ts";

const CONTINENT: Record<string, Continent> = {
  Q15: "africa",
  Q48: "asia",
  Q46: "europe",
  Q49: "north_america",
  Q18: "south_america",
  Q55643: "oceania",
  Q538: "oceania",
  Q3960: "oceania",
};
const MEMBERSHIP: Record<string, Membership> = {
  Q458: "eu",
  Q7184: "nato",
  Q7785: "commonwealth",
  Q243630: "brics",
  Q7795: "opec",
};
const LANGUAGE: Record<string, Language> = {
  Q1860: "en",
  Q150: "fr",
  Q1321: "es",
  Q13955: "ar",
  Q5146: "pt",
};
const MAX_ALIAS = 40;
const LEFT = "Q11920728";
const RIGHT = "Q14565199";
const LANDLOCKED = "Q123480";

interface Row {
  iso: string;
  p: string;
  v: string;
}

function cell(row: Record<string, unknown>, key: string): string {
  const c = row[key];

  return isRecord(c) ? asText(c.value) : "";
}

function rowsOf(json: unknown): Row[] {
  const results = isRecord(json) && isRecord(json.results) ? json.results : {};

  return records(results.bindings)
    .map((r) => ({ iso: cell(r, "iso"), p: cell(r, "p"), v: cell(r, "v") }))
    .filter((r) => r.iso !== "" && r.p !== "" && r.v !== "");
}

const qid = (uri: string): string => uri.slice(uri.lastIndexOf("/") + 1);

const add = <T>(list: T[], item: T | undefined) => {
  if (item !== undefined && !list.includes(item)) list.push(item);
};

type Apply = (f: Facts, v: string, snapshot: ReadonlySet<string>) => void;

const APPLY: Record<string, Apply> = {
  continent: (f, v) => add(f.continents, CONTINENT[qid(v)]),
  border: (f, v, snapshot) => snapshot.has(v) && add(f.borders, v),
  member: (f, v) => add(f.memberships, MEMBERSHIP[qid(v)]),
  language: (f, v) => add(f.languages, LANGUAGE[qid(v)]),
  alias: (f, v) => v.length <= MAX_ALIAS && add(f.aliases, v),
  monarchy: (f) => void (f.monarchy = true),
  type: (f, v) => void (qid(v) === LANDLOCKED ? (f.landlocked = true) : (f.island = true)),
};

function driving(rows: Row[]): boolean | null {
  const sides = new Set(rows.filter((r) => r.p === "driving").map((r) => qid(r.v)));

  if (sides.has(LEFT) === sides.has(RIGHT)) return null;

  return sides.has(LEFT);
}

/** Wikidata knows the country: absent monarchy/landlocked/island mean false rather than unknown. */
function settle(f: Facts, mine: Row[]): void {
  f.drivesLeft = driving(mine);
  f.borders.sort();

  if (mine.length === 0) return;

  f.monarchy ??= false;
  f.landlocked ??= false;
  f.island ??= false;
}

/** Facts per snapshot ISO2 code; false where Wikidata knows the country but not the fact, null where it knows nothing. */
export function parseFacts(json: unknown, snapshot: ReadonlySet<string>): Map<string, Facts> {
  const rows = rowsOf(json);
  const out = new Map([...snapshot].map((iso) => [iso, emptyFacts()]));

  for (const row of rows) {
    const f = out.get(row.iso);

    if (f) APPLY[row.p]?.(f, row.v, snapshot);

    if (f && row.p === "border") add(out.get(row.v)?.borders ?? [], row.iso);
  }

  landBorders(out);

  for (const [iso, f] of out)
    settle(
      f,
      rows.filter((r) => r.iso === iso),
    );

  return out;
}

const FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

/**
 * One P41 flag image per ISO2 code as an https Special:FilePath url. The query's wdt: already keeps
 * only best-rank statements (preferred over normal); ties go to the alphabetically first file.
 */
export function flagUrls(json: unknown): Map<string, string> {
  const files = new Map<string, string[]>();

  for (const { iso, p, v } of rowsOf(json)) {
    if (p === "flag") files.set(iso, [...(files.get(iso) ?? []), v.slice(v.lastIndexOf("/") + 1)]);
  }

  return new Map([...files].map(([iso, names]) => [iso, FILE_PATH + (names.toSorted()[0] ?? "")]));
}
