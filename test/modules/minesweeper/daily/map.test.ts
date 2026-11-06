import { describe, expect, test } from "bun:test";
import { lcg } from "../../../../src/core/random.ts";
import { adjacentMines } from "../../../../src/modules/minesweeper/field.ts";
import { dailyMap, MIN_OPENING } from "../../../../src/modules/minesweeper/daily/map.ts";
import { PRESETS } from "../../../../src/modules/minesweeper/setup.ts";

describe("dailyMap", () => {
  test("the same seed gives the same map", () => {
    expect(dailyMap(PRESETS.expert, lcg(7))).toEqual(dailyMap(PRESETS.expert, lcg(7)));
  });

  test("lays exactly the preset's mines", () => {
    const { field } = dailyMap(PRESETS.intermediate, lcg(3));
    expect(field.filter(Boolean)).toHaveLength(40);
  });

  for (const [name, setup] of Object.entries(PRESETS)) {
    test(`${name}: the opening is a safe zero with a big enough, mine-free region`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const { field, opening, open } = dailyMap(setup, lcg(seed));
        expect(field[opening]).toBe(false);
        expect(adjacentMines(field, opening, setup.width, setup.height)).toBe(0);
        expect(open).toContain(opening);
        expect(open.length).toBeGreaterThanOrEqual(MIN_OPENING);
        expect(open.some((i) => field[i])).toBe(false);
      }
    });
  }
});
