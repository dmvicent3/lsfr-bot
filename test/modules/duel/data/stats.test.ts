import { describe, expect, test } from "bun:test";
import { STAT_BY_ID, STATS } from "../../../../src/modules/duel/data/stats.ts";

describe("stats", () => {
  test("has 14 stats with unique ids", () => {
    const ids = STATS.map((s) => s.id);

    expect(ids.length).toBe(14);
    expect(new Set(ids).size).toBe(14);
  });

  test("lookup matches the list", () => {
    for (const stat of STATS) expect(STAT_BY_ID[stat.id]).toBe(stat);
  });

  test("density excludes city states", () => {
    expect(STAT_BY_ID.density.exclude).toEqual(["MC", "SG", "VA", "GI", "MO", "HK", "BH", "MT"]);
    expect(STAT_BY_ID.area.exclude).toEqual([]);
  });

  test("tourists stop at 2019, area is the total area", () => {
    expect(STAT_BY_ID.tourists.maxYear).toBe(2019);
    expect(STAT_BY_ID.area.label).toBe("total area");
  });

  test("peak comes from wikidata", () => {
    expect(STAT_BY_ID.peak.source).toEqual({ wikidata: "peak" });
    expect(STAT_BY_ID.co2_pc.source).toEqual({ wb: "EN.GHG.CO2.PC.CE.AR5" });
  });
});
