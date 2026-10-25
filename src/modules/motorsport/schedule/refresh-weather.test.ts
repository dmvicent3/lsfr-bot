import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { runMigrations } from "../../../core/db.ts";
import type { FetchFn } from "../../../core/types.ts";
import { coreMigrations } from "../../../core/settings.ts";
import { refreshWeather } from "./refresh.ts";
import { MotorsportRepo } from "../repo.ts";
import { motorsportMigrations } from "../store/migrations.ts";
import { applyRules } from "../pings/rules.ts";
import { fixture } from "../testing/fixtures.ts";
import { parseTunous } from "./sources/tunous.ts";

const NOW = new Date("2026-03-10T00:00:00Z");
let repo: MotorsportRepo;

/** Hourly forecast with the same values for every hour of 13–31 March 2026. */
function hourly(temp: number): unknown {
  const time: string[] = [];
  for (let d = 13; d <= 31; d++) {
    for (let h = 0; h < 24; h++) time.push(`2026-03-${d}T${String(h).padStart(2, "0")}:00`);
  }
  return {
    hourly: {
      time,
      temperature_2m: time.map(() => temp),
      precipitation_probability: time.map(() => 10),
      weather_code: time.map(() => 1),
    },
  };
}

async function weatherFetch(
  openMeteoStatus = 200,
  temp = 20,
  failLatitude: string | null = null,
): Promise<FetchFn> {
  const stF1 = JSON.stringify(await fixture("st-f1"));
  return async (url) => {
    if (url.includes("sportstimes/f1/main/_db/f1/2026.json")) return new Response(stF1);
    if (url.startsWith("https://api.open-meteo.com/")) {
      if (failLatitude !== null && url.includes(`latitude=${failLatitude}`)) {
        return new Response("", { status: 503 });
      }
      return new Response(JSON.stringify(hourly(temp)), { status: openMeteoStatus });
    }
    return new Response("", { status: 404 });
  };
}

beforeEach(async () => {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...motorsportMigrations]);
  repo = new MotorsportRepo(db);
  repo.sessions.replace(
    "f1",
    applyRules(parseTunous("f1", 2026, await fixture("tunous-formula1"))),
    0,
  );
});

test("stores forecasts for upcoming F1 sessions within range", async () => {
  await refreshWeather(repo, NOW, await weatherFetch());
  const weather = repo.weather.bySession("f1");
  expect(weather.get("2026-chinese-grand-prix/race")).toEqual({
    tempC: 20,
    rainChance: 10,
    code: 1,
  });
  expect([...weather.keys()].every((k) => k.startsWith("2026-chinese-grand-prix/"))).toBe(true);
});

test("a failing forecast keeps the previous weather", async () => {
  await refreshWeather(repo, NOW, await weatherFetch(200, 20));
  await refreshWeather(repo, NOW, await weatherFetch(500, 30));
  expect(repo.weather.bySession("f1").get("2026-chinese-grand-prix/race")?.tempC).toBe(20);
});

test("one track failing keeps its previous weather without discarding the others", async () => {
  const now = new Date("2026-03-14T00:00:00Z");
  await refreshWeather(repo, now, await weatherFetch(200, 20));
  await refreshWeather(repo, now, await weatherFetch(200, 30, "31.3807"));
  const weather = repo.weather.bySession("f1");
  expect(weather.get("2026-chinese-grand-prix/race")?.tempC).toBe(20);
  expect(weather.get("2026-japanese-grand-prix/race")?.tempC).toBe(30);
});
