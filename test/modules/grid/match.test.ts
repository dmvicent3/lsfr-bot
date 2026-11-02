import { describe, expect, test } from "bun:test";
import { loadSnapshotFile } from "../../../src/core/countries/load.ts";
import { matchCountry } from "../../../src/modules/grid/match/match.ts";

const snapshot = loadSnapshotFile(
  new URL("../../../src/core/countries/countries.json", import.meta.url),
)!;
const iso = (text: string) => matchCountry(text, snapshot)?.iso2 ?? null;
const nameOf = (text: string) => matchCountry(text, snapshot)?.name ?? null;

describe("exact", () => {
  test.each([
    ["USA", "US"],
    ["UK", "GB"],
    ["Great Britain", "GB"],
    ["Ivory Coast", "CI"],
    ["DRC", "CD"],
    ["Burma", "MM"],
    ["Czech Republic", "CZ"],
    ["UAE", "AE"],
    ["Holland", "NL"],
    ["  France ", "FR"],
  ])("%s", (text, code) => expect(iso(text)).toBe(code));

  test("accents, the, ampersand", () => {
    expect(iso("Côte d'Ivoire")).toBe("CI");
    expect(iso("Sao Tome")).toBe("ST");
    expect(iso("the Netherlands")).toBe("NL");
    expect(iso(" the gambia")).toBe("GM");
    expect(iso("Bosnia & Herzegovina")).toBe("BA");
  });
});

describe("typos", () => {
  test("one on 5+ letters, two on 9+", () => {
    expect(iso("Portgal")).toBe("PT");
    expect(iso("Philipines")).toBe("PH");
    expect(iso("Argentinna")).toBe("AR");
    expect(iso("Phillipines")).toBe("PH");
  });

  test("short or unknown text does not match", () => {
    expect(iso("Cub")).toBeNull();
    expect(iso("")).toBeNull();
    expect(iso("England")).toBeNull();
  });
});

describe("confusable pairs", () => {
  test.each([
    ["Nigr", null],
    ["Nigera", null],
    ["Nigerr", "Niger"],
    ["Nigeriaa", "Nigeria"],
    ["Nigria", "Nigeria"],
    ["Sudn", null],
    ["Sudann", "Sudan"],
    ["South Sudn", "South Sudan"],
    ["Souht Sudan", "South Sudan"],
    ["Guine", null],
    ["Guinee", "Guinea"],
    ["Guinea Bisau", "Guinea-Bissau"],
    ["Equatorial Guine", "Equatorial Guinea"],
    ["Papua New Guine", "Papua New Guinea"],
    ["Dominican", null],
    ["Dominicn", "Dominica"],
    ["Dominican Republc", "Dominican Republic"],
  ])("%s", (text, name) => expect(nameOf(text)).toBe(name));

  test("exact names stay themselves", () => {
    for (const n of ["Niger", "Nigeria", "Sudan", "South Sudan", "Guinea", "Dominica"]) {
      expect(nameOf(n)).toBe(n);
    }
  });
});

describe("aliases are exact-only", () => {
  test("Palua never becomes Nepal", () => {
    expect(["Palau", null]).toContain(nameOf("Palua"));
  });

  test("a typo of an alias-only form returns null", () => {
    expect(iso("Hollnd")).toBeNull();
    expect(iso("Ivory Coat")).toBeNull();
    expect(iso("Holland")).toBe("NL");
  });

  test("two countries equally near is ambiguous", () => {
    expect(iso("Aigeria")).toBeNull();
  });
});
