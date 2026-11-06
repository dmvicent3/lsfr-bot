import { describe, expect, test } from "bun:test";
import { buildDrivers, finishedChampions } from "../../../scripts/gacha-drivers/build.ts";
import { flagCode } from "../../../scripts/gacha-drivers/nationalities.ts";
import {
  parseDrivers,
  parseLeader,
  parseRaceCount,
  parseResults,
} from "../../../scripts/gacha-drivers/parse.ts";
import type { ApiResult } from "../../../scripts/gacha-drivers/types.ts";

const result = (driverId: string, season: number, position: string, grid: number): ApiResult => ({
  driverId,
  season,
  round: 1,
  position,
  grid,
  status: "Finished",
});

describe("parse", () => {
  test("drivers, results, the standings leader and the race count", () => {
    const drivers = {
      MRData: {
        DriverTable: {
          Drivers: [{ driverId: "x", givenName: "Ann", familyName: "Bee", nationality: "Dutch" }],
        },
      },
    };
    const results = {
      MRData: {
        RaceTable: {
          Races: [
            {
              season: "1999",
              round: "3",
              Results: [{ Driver: { driverId: "x" }, position: "2", grid: "1", status: "+1 Lap" }],
            },
          ],
        },
      },
    };
    const standings = {
      MRData: {
        StandingsTable: {
          StandingsLists: [
            {
              DriverStandings: [
                { position: "2", Driver: { driverId: "y" } },
                { position: "1", Driver: { driverId: "x" } },
              ],
            },
          ],
        },
      },
    };

    expect(parseDrivers(drivers)).toEqual([
      { id: "x", name: "Ann Bee", family: "Bee", nationality: "Dutch" },
    ]);
    expect(parseResults(results)).toEqual([
      { driverId: "x", season: 1999, round: 3, position: "2", grid: 1, status: "+1 Lap" },
    ]);
    expect(parseLeader(standings)).toBe("x");
    expect(parseLeader({})).toBeNull();
    expect(parseRaceCount({ MRData: { RaceTable: { Races: [{}, {}] } } })).toBe(2);
  });
});

describe("buildDrivers", () => {
  const drivers = [
    { id: "champ", name: "C Hamp", family: "Hamp", nationality: "British" },
    { id: "winner", name: "W Inner", family: "Inner", nationality: "Italian" },
    { id: "runner", name: "R Unner", family: "Unner", nationality: "Swiss" },
    { id: "reserve", name: "No Start", family: "Start", nationality: "" },
  ];
  const results = [
    result("champ", 1960, "1", 1),
    result("champ", 1962, "3", 2),
    result("winner", 1961, "1", 4),
    result("runner", 1961, "5", 1),
    { ...result("runner", 1963, "", 30), status: "Did not qualify" },
  ];

  test("tiers from titles and wins; stats from results; non-starters left out", () => {
    const built = buildDrivers(drivers, results, new Map([[1960, "champ"]]));

    expect(built).toEqual([
      {
        id: "champ",
        name: "C Hamp",
        family: "Hamp",
        country: "GB",
        first: 1960,
        last: 1962,
        titles: 1,
        wins: 1,
        poles: 1,
        starts: 2,
        tier: 5,
      },
      {
        id: "winner",
        name: "W Inner",
        family: "Inner",
        country: "IT",
        first: 1961,
        last: 1961,
        titles: 0,
        wins: 1,
        poles: 0,
        starts: 1,
        tier: 4,
      },
      {
        id: "runner",
        name: "R Unner",
        family: "Unner",
        country: "CH",
        first: 1961,
        last: 1961,
        titles: 0,
        wins: 0,
        poles: 1,
        starts: 1,
        tier: 3,
      },
    ]);
  });
});

describe("finishedChampions", () => {
  test("the latest season counts only once its calendar is raced", () => {
    const leaders = new Map<number, string | null>([
      [2024, "a"],
      [2025, "b"],
      [2026, "c"],
    ]);

    expect([...finishedChampions(leaders, { season: 2026, races: 24, raced: 20 })]).toEqual([
      [2024, "a"],
      [2025, "b"],
    ]);
    expect(finishedChampions(leaders, { season: 2026, races: 24, raced: 24 }).get(2026)).toBe("c");
  });
});

describe("flagCode", () => {
  test("maps nationalities and refuses unknown ones", () => {
    expect(flagCode("Monegasque")).toBe("MC");
    expect(() => flagCode("Martian")).toThrow();
  });
});
