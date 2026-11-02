import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { loadSnapshot } from "../../../../src/modules/duel/data/load.ts";

const spies: { mockRestore(): void }[] = [];

afterEach(() => {
  for (const s of spies.splice(0)) s.mockRestore();
});

const raw = (values: unknown) => ({
  builtAt: "2026-11-02",
  countries: [{ iso2: "NL", name: "Netherlands", values }],
});

describe("loadSnapshot", () => {
  test("rejects non-objects and missing countries", () => {
    expect(loadSnapshot(null)).toBeNull();
    expect(loadSnapshot("x")).toBeNull();
    expect(loadSnapshot({ builtAt: "x" })).toBeNull();
  });

  test("keeps valid readings", () => {
    const snap = loadSnapshot(raw({ population: { value: 5, year: 2023 } }));

    expect(snap?.countries[0]?.values.population).toEqual({ value: 5, year: 2023 });
  });

  test("drops bad readings and logs them", () => {
    const spy = spyOn(console, "log").mockImplementation(() => {});
    spies.push(spy);
    const snap = loadSnapshot(
      raw({
        population: { value: 0, year: 2023 },
        area: { value: "x", year: 2023 },
        density: { value: 5 },
        gdp_pc: { value: 5, year: 2023.5 },
        nonsense: { value: 5, year: 2023 },
        life_exp: { value: 80, year: 2022 },
      }),
    );

    expect(snap?.countries[0]?.values).toEqual({ life_exp: { value: 80, year: 2022 } });
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  test("skips malformed countries", () => {
    const snap = loadSnapshot({ builtAt: "x", countries: [{ name: "x" }, 3] });

    expect(snap?.countries).toEqual([]);
  });
});
