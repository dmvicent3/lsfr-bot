import { describe, expect, test } from "bun:test";
import { parseWbCountries, parseWbIndicator } from "../../../scripts/duel-data/parse-wb.ts";
import { parseWikidataPeaks } from "../../../scripts/duel-data/parse-wikidata.ts";
import countries from "./fixtures/wb-countries.json";
import indicator from "./fixtures/wb-indicator.json";
import peaks from "./fixtures/wikidata-peaks.json";

describe("parseWbCountries", () => {
  test("drops aggregates and keeps Kosovo", () => {
    const list = parseWbCountries(countries);

    expect(list.map((c) => c.iso2).toSorted()).toEqual(["AW", "DJ", "NL", "PT", "XK"]);
    expect(list.find((c) => c.iso2 === "NL")?.name).toBe("Netherlands");
  });

  test("bad input gives an empty list", () => {
    expect(parseWbCountries({})).toEqual([]);
  });
});

describe("parseWbIndicator", () => {
  const map = parseWbIndicator(indicator);

  test("picks the latest non-null year", () => {
    expect(map.get("NL")).toEqual({ value: 7265000, year: 2020 });
    expect(map.get("PT")).toEqual({ value: 4208000, year: 2020 });
  });

  test("ignores readings before 2015", () => {
    expect(map.has("DJ")).toBe(false);
  });

  test("bad input gives an empty map", () => {
    expect(parseWbIndicator(null).size).toBe(0);
  });
});

describe("parseWikidataPeaks", () => {
  const map = parseWikidataPeaks(peaks, 2026);

  test("keeps the highest elevation per country", () => {
    expect(map.get("VN")).toEqual({ value: 3147.3, year: 2026 });
    expect(map.get("AQ")?.value).toBe(4892);
  });

  test("one row stays as is", () => {
    expect(map.get("NL")).toEqual({ value: 870, year: 2026 });
  });
});
