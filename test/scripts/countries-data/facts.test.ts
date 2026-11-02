import { describe, expect, test } from "bun:test";
import { flagUrls, parseFacts } from "../../../scripts/countries-data/parse-facts.ts";

const E = "http://www.wikidata.org/entity/";
const row = (iso: string, p: string, v: string) => ({
  iso: { value: iso },
  p: { value: p },
  v: { value: v },
});
const q = (id: string) => `${E}${id}`;

const JSON_ROWS = {
  results: {
    bindings: [
      row("NL", "continent", q("Q46")),
      row("NL", "border", "BE"),
      row("NL", "border", "DE"),
      row("NL", "border", "ZZ"),
      row("NL", "member", q("Q458")),
      row("NL", "member", q("Q7184")),
      row("NL", "member", q("Q999")),
      row("NL", "language", q("Q1860")),
      row("NL", "monarchy", q("Q7269")),
      row("NL", "driving", q("Q14565199")),
      row("NL", "alias", "Holland"),
      row("NL", "alias", "x".repeat(41)),
      row("TR", "continent", q("Q48")),
      row("TR", "continent", q("Q46")),
      row("TR", "language", q("Q13955")),
      row("DE", "border", "NL"),
      row("DE", "type", q("Q123480")),
      row("AU", "continent", q("Q3960")),
      row("AU", "type", q("Q112099")),
      row("AU", "member", q("Q7785")),
      row("AU", "driving", q("Q11920728")),
      row("BR", "member", q("Q243630")),
      row("BR", "language", q("Q5146")),
      row("SA", "member", q("Q7795")),
      row("ES", "language", q("Q1321")),
      row("FR", "language", q("Q150")),
      row("CL", "continent", q("Q18")),
      row("EG", "continent", q("Q15")),
      row("US", "continent", q("Q49")),
      row("NL", "flag", "http://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20NL.svg"),
    ],
  },
};

const ISO = new Set(["NL", "BE", "DE", "TR", "AU", "BR", "SA", "ES", "FR", "CL", "EG", "US", "XK"]);
const facts = parseFacts(JSON_ROWS, ISO);

const get = (iso: string) => {
  const f = facts.get(iso);

  if (!f) throw new Error(`no facts for ${iso}`);

  return f;
};

describe("parseFacts", () => {
  test("maps continents, two for a transcontinental country, Australia to Oceania", () => {
    expect(get("NL").continents).toEqual(["europe"]);
    expect(get("TR").continents.toSorted()).toEqual(["asia", "europe"]);
    expect(get("AU").continents).toEqual(["oceania"]);
    expect(get("CL").continents).toEqual(["south_america"]);
    expect(get("EG").continents).toEqual(["africa"]);
    expect(get("US").continents).toEqual(["north_america"]);
  });

  test("borders keep snapshot countries only", () => {
    expect(get("NL").borders).toEqual(["BE", "DE"]);
  });

  test("borders are symmetric", () => {
    expect(get("DE").borders).toEqual(["NL"]);
    expect(get("BE").borders).toEqual(["NL"]);
  });

  test("memberships use the fixed item ids", () => {
    expect(get("NL").memberships).toEqual(["eu", "nato"]);
    expect(get("AU").memberships).toEqual(["commonwealth"]);
    expect(get("BR").memberships).toEqual(["brics"]);
    expect(get("SA").memberships).toEqual(["opec"]);
  });

  test("official languages", () => {
    expect(get("NL").languages).toEqual(["en"]);
    expect(get("TR").languages).toEqual(["ar"]);
    expect(get("BR").languages).toEqual(["pt"]);
    expect(get("ES").languages).toEqual(["es"]);
    expect(get("FR").languages).toEqual(["fr"]);
  });

  test("monarchy, driving side, landlocked and island", () => {
    expect(get("NL").monarchy).toBe(true);
    expect(get("DE").monarchy).toBe(false);
    expect(get("NL").drivesLeft).toBe(false);
    expect(get("AU").drivesLeft).toBe(true);
    expect(get("DE").drivesLeft).toBeNull();
    expect(get("DE").landlocked).toBe(true);
    expect(get("NL").landlocked).toBe(false);
    expect(get("AU").island).toBe(true);
  });

  test("aliases are capped at 40 characters", () => {
    expect(get("NL").aliases).toEqual(["Holland"]);
  });

  test("a country Wikidata knows nothing about has null flags and empty lists", () => {
    expect(get("XK")).toEqual({
      continents: [],
      borders: [],
      landlocked: null,
      island: null,
      memberships: [],
      languages: [],
      monarchy: null,
      drivesLeft: null,
      flagColours: [],
      flagFeatures: [],
      aliases: [],
    });
  });
});

describe("flagUrls", () => {
  test("turns P41 file paths into https Special:FilePath urls", () => {
    expect(flagUrls(JSON_ROWS).get("NL")).toBe(
      "https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20NL.svg",
    );
  });
});

describe("flagUrls order", () => {
  test("picks the alphabetically first file whatever the row order", () => {
    const rows = ["Flag%20B.svg", "Flag%20A.svg"].map((f) => row("NL", "flag", `http://x/${f}`));

    expect(flagUrls({ results: { bindings: rows } }).get("NL")).toEndWith("Flag%20A.svg");
  });
});

describe("land borders", () => {
  const rows = [
    row("DO", "border", "HT"),
    row("DO", "type", q("Q112099")),
    row("HT", "type", q("Q112099")),
    row("JP", "border", "RU"),
    row("JP", "type", q("Q112099")),
    row("RU", "border", "US"),
    row("RU", "border", "NO"),
    row("US", "border", "CA"),
    row("CN", "border", "KR"),
    row("CN", "border", "KP"),
    row("CN", "type", q("Q123480")),
  ];
  const iso = new Set(["DO", "HT", "JP", "RU", "US", "NO", "CA", "CN", "KR", "KP", "HK"]);
  const border = parseFacts({ results: { bindings: rows } }, iso);

  test("drops sea neighbours and islands except a shared island", () => {
    expect(border.get("DO")?.borders).toEqual(["HT"]);
    expect(border.get("JP")?.borders).toEqual([]);
    expect(border.get("RU")?.borders).toEqual(["NO"]);
    expect(border.get("US")?.borders).toEqual(["CA"]);
    expect(border.get("CN")?.borders).toEqual(["HK", "KP"]);
  });

  test("adds the land borders Wikidata leaves out", () => {
    expect(border.get("HK")?.borders).toEqual(["CN"]);
  });
});
