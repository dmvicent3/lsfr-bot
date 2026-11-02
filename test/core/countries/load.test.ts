import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { loadSnapshot, loadSnapshotFile, readSnapshot } from "../../../src/core/countries/load.ts";

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
        life_exp: { value: 80, year: 2022 },
      }),
    );

    expect(snap?.countries[0]?.values).toEqual({ life_exp: { value: 80, year: 2022 } });
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  test("keeps unknown stat ids", () => {
    const snap = loadSnapshot(
      raw({ nonsense: { value: 5, year: 2023 }, bad: { value: -1, year: 1 } }),
    );

    expect(snap?.countries[0]?.values).toEqual({ nonsense: { value: 5, year: 2023 } });
  });

  test("skips malformed countries", () => {
    const snap = loadSnapshot({ builtAt: "x", countries: [{ name: "x" }, 3] });

    expect(snap?.countries).toEqual([]);
  });
});

describe("readSnapshot", () => {
  test("caches the first read", () => {
    const path = join(mkdtempSync(join(tmpdir(), "snap-")), "c.json");

    writeFileSync(path, JSON.stringify(raw({ population: { value: 5, year: 2023 } })));

    const first = readSnapshot(path);

    expect(first?.countries).toHaveLength(1);
    expect(readSnapshot(path)).toBe(first);
  });
});

describe("facts", () => {
  test("missing facts load as empty lists and nulls", () => {
    const facts = loadSnapshot(raw({}))?.countries[0]?.facts;

    expect(facts?.continents).toEqual([]);
    expect(facts?.aliases).toEqual([]);
    expect(facts?.landlocked).toBeNull();
    expect(facts?.drivesLeft).toBeNull();
  });

  test("keeps valid facts and drops unknown members", () => {
    const snap = loadSnapshot({
      builtAt: "x",
      countries: [
        {
          iso2: "NL",
          name: "Netherlands",
          values: {},
          facts: {
            continents: ["europe", "mars"],
            borders: ["BE", 3],
            landlocked: false,
            island: "yes",
            memberships: ["eu", "nope"],
            languages: ["en"],
            monarchy: true,
            flagColours: ["red", "pink"],
            flagFeatures: ["star", "sun"],
            aliases: ["Holland", 4],
          },
        },
      ],
    });
    const facts = snap?.countries[0]?.facts;

    expect(facts?.continents).toEqual(["europe"]);
    expect(facts?.borders).toEqual(["BE"]);
    expect(facts?.landlocked).toBe(false);
    expect(facts?.island).toBeNull();
    expect(facts?.memberships).toEqual(["eu"]);
    expect(facts?.monarchy).toBe(true);
    expect(facts?.flagColours).toEqual(["red"]);
    expect(facts?.flagFeatures).toEqual(["star"]);
    expect(facts?.aliases).toEqual(["Holland"]);
  });
});

describe("loadSnapshotFile", () => {
  test("reads uncached and returns null for a missing file", () => {
    const dir = mkdtempSync(join(tmpdir(), "snap-"));
    const path = join(dir, "s.json");

    writeFileSync(path, JSON.stringify(raw({})));
    const a = loadSnapshotFile(path);

    expect(a?.countries[0]?.iso2).toBe("NL");
    expect(loadSnapshotFile(path)).not.toBe(a);

    const spy = spyOn(console, "error").mockImplementation(() => {});

    spies.push(spy);
    expect(loadSnapshotFile(join(dir, "nope.json"))).toBeNull();
  });
});
