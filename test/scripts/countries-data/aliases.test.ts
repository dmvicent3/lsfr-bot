import { describe, expect, test } from "bun:test";
import { mergeAliases } from "../../../scripts/countries-data/aliases.ts";

const merge = (wikidata: Record<string, string[]>) =>
  mergeAliases(
    ["US", "GB", "CN", "AS", "BM", "SG", "AA", "BB"].map((iso2) => ({
      iso2,
      name: `Name ${iso2}`,
    })),
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

  test("three-letter all-caps Wikidata aliases are kept", () => {
    expect(merge({ CN: ["PRC"] }).get("CN")).toContain("PRC");
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
