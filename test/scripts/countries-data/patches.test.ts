import { describe, expect, test } from "bun:test";
import { emptyFacts } from "../../../src/core/countries/facts.ts";
import { applyPatches, TERRITORIES } from "../../../scripts/countries-data/patches.ts";

const facts = (iso2s: string[]) => new Map(iso2s.map((iso2) => [iso2, emptyFacts()]));

describe("applyPatches", () => {
  test("applies a patch to its country only", () => {
    const map = facts(["GB", "FR"]);

    applyPatches(map);

    expect(map.get("GB")?.memberships).toContain("commonwealth");
    expect(map.get("FR")?.memberships).toEqual([]);
  });

  test("territories get no monarchy or island answer, countries keep theirs", () => {
    const map = facts(["AW", "GI", "XK", "PS", "MT"]);

    for (const f of map.values()) Object.assign(f, { monarchy: true, island: true });

    applyPatches(map);

    for (const iso2 of ["AW", "GI"]) {
      expect(map.get(iso2)?.monarchy).toBeNull();
      expect(map.get(iso2)?.island).toBeNull();
    }

    expect(map.get("MT")?.island).toBe(true);
    expect(map.get("XK")?.island).toBe(true);
    expect(TERRITORIES).not.toContain("XK");
    expect(TERRITORIES).not.toContain("PS");
  });
});
