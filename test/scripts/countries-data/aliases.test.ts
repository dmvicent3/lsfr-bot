import { describe, expect, test } from "bun:test";
import { mergeAliases } from "../../../scripts/countries-data/aliases.ts";

const merge = (wikidata: Record<string, string[]>) =>
  mergeAliases(
    ["US", "GB", "CN", "AS", "BM", "SG", "AA", "BB", "PG", "CF", "CG", "CD", "PS", "CZ"].map(
      (iso2) => ({
        iso2,
        name: `Name ${iso2}`,
      }),
    ),
    new Map(Object.entries(wikidata)),
  );

describe("mergeAliases", () => {
  test("England is blocked", () => {
    expect(merge({ GB: ["England", "Albion"] }).get("GB")).toEqual(
      expect.not.arrayContaining(["England"]),
    );
    expect(merge({ GB: ["England", "Albion"] }).get("GB")).toContain("Albion");
  });

  test("an alias owned by two countries is dropped from both", () => {
    const out = merge({ AA: ["Shared Land", "Only Aa"], BB: ["Shared Land"] });

    expect(out.get("AA")).toEqual(["Only Aa"]);
    expect(out.get("BB")).toEqual([]);
  });

  test("short checked-in aliases such as USA are kept", () => {
    expect(merge({}).get("US")).toEqual(expect.arrayContaining(["USA", "US"]));
  });

  test("three-letter all-caps Wikidata aliases are dropped, curated ones kept", () => {
    expect(merge({ CN: ["PRC", "Mainland"] }).get("CN")).toEqual(["Mainland"]);
    expect(merge({}).get("PG")).toContain("PNG");
    expect(merge({}).get("CF")).toContain("CAR");
  });

  test("Congo alone is not an alias of either Congo", () => {
    const out = merge({ CG: ["Congo"], CD: ["Congo"] });

    expect(out.get("CG")).not.toContain("Congo");
    expect(out.get("CD")).not.toContain("Congo");
    expect(merge({ CG: ["Congo"] }).get("CG")).not.toContain("Congo");
  });

  test("curated Brazzaville, Palestinian Territories and Czech aliases", () => {
    const out = merge({});

    expect(out.get("CG")).toEqual(expect.arrayContaining(["Brazzaville", "Congo-Brazzaville"]));
    expect(out.get("PS")).toContain("Palestinian Territories");
    expect(out.get("CZ")).toContain("Czech");
  });

  test("junk is filtered: codes, time zones, generic phrases", () => {
    const out = merge({
      AS: ["ISO 3166-1:AS", "US-AS", "East Samoa"],
      BM: ["Atlantic/Bermuda", "Barmuda"],
      SG: ["Garden City", "Lion City"],
    });

    expect(out.get("AS")).toEqual(["East Samoa"]);
    expect(out.get("BM")).toEqual(["Barmuda"]);
    expect(out.get("SG")).toEqual(["Lion City"]);
  });
});
