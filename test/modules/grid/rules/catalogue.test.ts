import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { loadSnapshot } from "../../../../src/core/countries/load.ts";
import type { RuleId } from "../../../../src/modules/grid/types.ts";
import { RULES, RULE_IDS } from "../../../../src/modules/grid/rules/catalogue.ts";
import { failures } from "../../../../src/modules/grid/rules/explain.ts";
import { country, reading } from "./fixtures.ts";

// readSnapshot() caches per process and other tests seed it with fixtures, so load the real file directly.
const real = () =>
  loadSnapshot(
    JSON.parse(
      readFileSync(
        new URL("../../../../src/core/countries/countries.json", import.meta.url),
        "utf8",
      ),
    ),
  )!;
const t = (id: RuleId, c = country()) => RULES[id].test(c);
const n = (k: number) =>
  country({ facts: { borders: Array.from({ length: k }, (_, i) => `B${i}`) } });
const at = (id: string, v: number | null, rule: RuleId) =>
  t(rule, country({ values: v === null ? {} : { [id]: reading(v) } }));

describe("geo", () => {
  test("continents, including transcontinental", () => {
    const turkey = country({ facts: { continents: ["europe", "asia"] } });

    expect(t("asia", turkey)).toBe(true);
    expect(t("europe", turkey)).toBe(true);
    expect(t("africa", turkey)).toBe(false);
    expect(RULES.africa.group).toBe("continent");
    expect(RULES.landlocked.group).toBeUndefined();
  });

  test("landlocked and island, null never matches", () => {
    expect(t("landlocked", country({ facts: { landlocked: true } }))).toBe(true);
    expect(t("landlocked", country({ facts: { landlocked: null } }))).toBe(false);
    expect(t("island", country({ facts: { island: true } }))).toBe(true);
    expect(t("island", country({ facts: { island: null } }))).toBe(false);
  });

  test("borders", () => {
    expect([t("borders_4", n(3)), t("borders_4", n(4))]).toEqual([false, true]);
    expect([t("borders_0_1", n(0)), t("borders_0_1", n(1)), t("borders_0_1", n(2))]).toEqual([
      true,
      true,
      false,
    ]);
  });

  test("name letter ignores accents and a leading The", () => {
    expect(t("letter_a", country({ name: "Åland" }))).toBe(true);
    expect(t("letter_b", country({ name: "The Bahamas" }))).toBe(true);
    expect(t("letter_s", country({ name: "The Bahamas" }))).toBe(false);
    expect(t("letter_c", country({ name: "Côte d'Ivoire" }))).toBe(true);
  });

  test("letter rules only exist for letters with 12+ countries", () => {
    const counts: Record<string, number> = {};

    for (const c of real().countries) {
      const plain = c.name
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/^the\s+/i, "");
      const l = plain[0]!.toLowerCase();

      counts[l] = (counts[l] ?? 0) + 1;
    }

    const letters = RULE_IDS.filter((id) => id.startsWith("letter_")).map((id) => id.slice(7));

    expect(letters.length).toBeGreaterThan(0);

    for (const l of letters) expect(counts[l] ?? 0).toBeGreaterThanOrEqual(12);
  });
});

describe("flag", () => {
  test("colour and feature", () => {
    const c = country({ facts: { flagColours: ["red"], flagFeatures: ["star"] } });

    expect(t("flag_red", c)).toBe(true);
    expect(t("flag_blue", c)).toBe(false);
    expect(t("flag_star", c)).toBe(true);
    expect(t("flag_crescent", c)).toBe(false);
    expect(t("flag_emblem", country({ facts: { flagFeatures: ["emblem"] } }))).toBe(true);
  });
});

describe("stat", () => {
  test("population boundaries", () => {
    expect([
      at("population", 50_000_000, "pop_over_50m"),
      at("population", 50_000_001, "pop_over_50m"),
    ]).toEqual([false, true]);
    expect([
      at("population", 1_000_000, "pop_under_1m"),
      at("population", 999_999, "pop_under_1m"),
    ]).toEqual([false, true]);
  });

  test("area boundaries", () => {
    expect([at("area", 1_000_000, "area_over_1m"), at("area", 1_000_001, "area_over_1m")]).toEqual([
      false,
      true,
    ]);
    expect([at("area", 10_000, "area_under_10k"), at("area", 9_999, "area_under_10k")]).toEqual([
      false,
      true,
    ]);
  });

  test("gdp boundaries", () => {
    expect([at("gdp_pc", 30_000, "gdp_over_30k"), at("gdp_pc", 30_001, "gdp_over_30k")]).toEqual([
      false,
      true,
    ]);
    expect([at("gdp_pc", 2_000, "gdp_under_2k"), at("gdp_pc", 1_999, "gdp_under_2k")]).toEqual([
      false,
      true,
    ]);
  });

  test("missing readings never match", () => {
    for (const r of [
      "pop_over_50m",
      "pop_under_1m",
      "area_over_1m",
      "area_under_10k",
      "gdp_over_30k",
      "gdp_under_2k",
    ] as const)
      expect(at("population", null, r)).toBe(false);
  });
});

describe("politics", () => {
  test("memberships", () => {
    const c = country({ facts: { memberships: ["eu", "opec"] } });

    expect([t("eu", c), t("nato", c), t("commonwealth", c), t("brics_opec", c)]).toEqual([
      true,
      false,
      false,
      true,
    ]);
    expect(t("brics_opec", country({ facts: { memberships: ["brics"] } }))).toBe(true);
  });

  test("languages", () => {
    const c = country({ facts: { languages: ["en", "ar"] } });

    expect([t("lang_en", c), t("lang_fr", c), t("lang_es", c), t("lang_ar", c)]).toEqual([
      true,
      false,
      false,
      true,
    ]);
  });

  test("monarchy and left driving, null never matches", () => {
    expect(t("monarchy", country({ facts: { monarchy: true } }))).toBe(true);
    expect(t("monarchy", country({ facts: { monarchy: null } }))).toBe(false);
    expect(t("drives_left", country({ facts: { drivesLeft: true } }))).toBe(true);
    expect(t("drives_left", country({ facts: { drivesLeft: null } }))).toBe(false);
  });
});

describe("catalogue", () => {
  test("ids match keys and every rule has label and why", () => {
    for (const id of RULE_IDS) {
      expect(RULES[id].id).toBe(id);
      expect(RULES[id].label.length).toBeGreaterThan(0);
      expect(RULES[id].why.length).toBeGreaterThan(0);
    }
  });

  test("failures lists the why of each failing rule", () => {
    const botswana = country({ facts: { continents: ["africa"] } });

    expect(failures(["africa", "monarchy"], botswana)).toEqual(["isn't a monarchy"]);
    expect(failures(["africa"], botswana)).toEqual([]);
  });
});
