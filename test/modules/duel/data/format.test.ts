import { describe, expect, test } from "bun:test";
import { flag } from "../../../../src/modules/duel/data/flag.ts";
import { formatValue } from "../../../../src/modules/duel/data/format.ts";
import type { StatId } from "../../../../src/modules/duel/types.ts";

const r = (value: number) => ({ value, year: 2023 });

describe("flag", () => {
  test("regional indicator pair", () => {
    expect(flag("NL")).toBe("🇳🇱");
    expect(flag("pt")).toBe("🇵🇹");
  });
});

describe("formatValue", () => {
  const cases: [StatId, number, string][] = [
    ["population", 17900000, "17,900,000"],
    ["area", 41850, "41,850 km²"],
    ["density", 521.2, "521 /km²"],
    ["gdp_pc", 57025.4, "$57,025"],
    ["life_exp", 81.66, "81.7 years"],
    ["urban", 92.14, "92.1%"],
    ["co2_pc", 7.1, "7.1 t"],
    ["fertility", 1.616, "1.62"],
    ["peak", 322, "322 m"],
    ["tourists", 1234567, "1,234,567"],
  ];

  for (const [id, value, out] of cases) {
    test(`${id} ${value}`, () => expect(formatValue(id, r(value))).toBe(out));
  }
});
